/**
 * @fileoverview Rutas de autenticación y gestión de usuarios administradores.
 *
 * Endpoints:
 * - `POST /api/auth/login` — Iniciar sesión
 * - `GET  /api/auth/me` — Verificar sesión activa
 * - `POST /api/auth/logout` — Cerrar sesión
 * - `POST /api/auth/setup` — Crear primer administrador
 * - `GET  /api/auth/needs-setup` — Verificar si el sistema necesita setup
 * - `GET  /api/users` — Listar administradores (protegido)
 * - `POST /api/users` — Crear administrador (protegido)
 * - `PATCH /api/users/:id/password` — Cambiar contraseña (protegido)
 * - `PATCH /api/users/:id/username` — Cambiar nombre de usuario (protegido)
 * - `DELETE /api/users/:id` — Eliminar administrador (protegido)
 *
 * @module server/routes/auth
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import config from "../config.js";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { parseIdParam, sanitizeText } from "../lib/validation.js";

const JWT_SECRET = config.jwtSecret;
const SESSION_DURATION = config.sessionDuration;

/**
 * Hashea una contraseña con bcrypt (cost 10).
 * @param password - Contraseña en texto plano.
 * @returns Hash bcrypt.
 */
async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
}

/**
 * Verifica una contraseña contra un hash bcrypt.
 * @param password - Contraseña en texto plano.
 * @param hash - Hash bcrypt almacenado.
 * @returns `true` si la contraseña coincide.
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

/**
 * Genera un token de sesión criptográficamente seguro.
 * @returns Token de 48 caracteres (nanoid).
 */
function createSessionToken(): string {
  return nanoid(48);
}

/**
 * Calcula la fecha de expiración de una sesión (7 días desde ahora).
 * @returns Timestamp ISO 8601 de expiración.
 */
function getExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

/**
 * Valida un token de sesión contra la base de datos.
 * Elimina sesiones expiradas automáticamente.
 * @param token - Token Bearer de la cabecera Authorization.
 * @returns ID del usuario autenticado, o `null` si el token es inválido/expirado.
 */
export async function validateSession(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  const session = db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.token, token))
    .get();

  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    db.delete(schema.sessions).where(eq(schema.sessions.token, token)).run();
    return null;
  }
  return session.userId;
}

/**
 * Middleware que requiere autenticación válida.
 * Inyecta `userId` y `userRole` en el request.
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = await validateSession(token);
  if (!userId) {
    return reply.status(401).send({ error: "No autorizado" });
  }
  const user = db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, userId)).get();
  (req as any).userId = userId;
  (req as any).userRole = user?.role || "admin";
}

/**
 * Middleware que requiere rol `admin`. Bloquea usuarios `demo`.
 * Debe usarse después de `requireAuth`.
 */
export async function requireAdminRole(req: FastifyRequest, reply: FastifyReply) {
  if ((req as any).userRole === "demo") {
    return reply.status(403).send({ error: "Acceso de solo lectura — usuario demo" });
  }
}

export async function authRoutes(app: FastifyInstance) {
  // Login
  app.post<{ Body: { username: string; password: string } }>(
    "/api/auth/login",
    async (req, reply) => {
      const { username, password } = req.body;

      if (!username || !password) {
        return reply.status(400).send({ error: "Usuario y contraseña requeridos" });
      }

      const user = db
        .select()
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.username, username))
        .get();

      if (!user) {
        return reply.status(401).send({ error: "Credenciales incorrectas" });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return reply.status(401).send({ error: "Credenciales incorrectas" });
      }

      const token = createSessionToken();
      const expiresAt = getExpiresAt();

      db.insert(schema.sessions)
        .values({ token, userId: user.id, expiresAt })
        .run();

      return { token, username: user.username, role: user.role, expiresAt };
    }
  );

  // Check session
  app.get("/api/auth/me", async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = await validateSession(token);

    if (!userId) {
      return reply.status(401).send({ error: "No autorizado" });
    }

    const user = db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, userId))
      .get();

    if (!user) {
      return reply.status(401).send({ error: "No autorizado" });
    }

    return { username: user.username, role: user.role };
  });

  // Logout
  app.post("/api/auth/logout", async (req) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      db.delete(schema.sessions).where(eq(schema.sessions.token, token)).run();
    }
    return { success: true };
  });

  // Setup: create first admin if none exists
  app.post<{ Body: { username: string; password: string } }>(
    "/api/auth/setup",
    async (req, reply) => {
      const existing = db.select().from(schema.adminUsers).all();
      if (existing.length > 0) {
        return reply.status(403).send({ error: "Ya existe un administrador" });
      }

      const { username, password } = req.body;
      if (!username?.trim() || !password || password.length < 4) {
        return reply.status(400).send({ error: "Usuario y contraseña (min 4 chars) requeridos" });
      }

      const passwordHash = await hashPassword(password);
      db.insert(schema.adminUsers)
        .values({ username: sanitizeText(username, 50), passwordHash })
        .run();

      return { success: true, message: "Administrador creado" };
    }
  );

  // Check if setup is needed (demo users don't count as real admins)
  app.get("/api/auth/needs-setup", async () => {
    const admins = db.select().from(schema.adminUsers)
      .where(eq(schema.adminUsers.role, "admin"))
      .all();
    return { needsSetup: admins.length === 0 };
  });

  // List all users (admin only)
  app.get("/api/users", { preHandler: requireAuth }, async () => {
    const users = db.select({ id: schema.adminUsers.id, username: schema.adminUsers.username, role: schema.adminUsers.role, createdAt: schema.adminUsers.createdAt })
      .from(schema.adminUsers)
      .orderBy(schema.adminUsers.id)
      .all();
    return users;
  });

  // Create new user (admin only, blocked for demo)
  app.post<{ Body: { username: string; password: string; role: "admin" | "demo" } }>(
    "/api/users",
    { preHandler: [requireAuth, requireAdminRole] },
    async (req, reply) => {
      const { username, password, role } = req.body;
      
      if (!username?.trim() || !password || password.length < 4) {
        return reply.status(400).send({ error: "Usuario y contraseña (min 4 chars) requeridos" });
      }

      const existing = db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, username.trim())).get();
      if (existing) {
        return reply.status(409).send({ error: "El usuario ya existe" });
      }

      const passwordHash = await hashPassword(password);
      const user = db.insert(schema.adminUsers)
        .values({ username: sanitizeText(username, 50), passwordHash, role: role === "demo" ? "demo" : "admin" })
        .returning({ id: schema.adminUsers.id, username: schema.adminUsers.username, role: schema.adminUsers.role, createdAt: schema.adminUsers.createdAt })
        .get();

      return user;
    }
  );

  // Update user password (admin only, blocked for demo)
  app.patch<{ Params: { id: string }; Body: { password: string } }>(
    "/api/users/:id/password",
    { preHandler: [requireAuth, requireAdminRole] },
    async (req, reply) => {
      const id = parseIdParam(req.params.id, reply);
      if (!id) return;
      const { password } = req.body;

      if (!password || password.length < 4) {
        return reply.status(400).send({ error: "Contraseña (min 4 chars) requerida" });
      }

      const user = db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id)).get();
      if (!user) {
        return reply.status(404).send({ error: "Usuario no encontrado" });
      }

      const passwordHash = await hashPassword(password);
      db.update(schema.adminUsers).set({ passwordHash }).where(eq(schema.adminUsers.id, id)).run();
      
      // Revoke all sessions for this user
      db.delete(schema.sessions).where(eq(schema.sessions.userId, id)).run();
      
      return { success: true };
    }
  );

  // Update username (admin only, blocked for demo)
  app.patch<{ Params: { id: string }; Body: { username: string } }>(
    "/api/users/:id/username",
    { preHandler: [requireAuth, requireAdminRole] },
    async (req, reply) => {
      const id = parseIdParam(req.params.id, reply);
      if (!id) return;
      const { username } = req.body;

      if (!username?.trim()) {
        return reply.status(400).send({ error: "Usuario requerido" });
      }

      const safe = sanitizeText(username, 50);

      const user = db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id)).get();
      if (!user) {
        return reply.status(404).send({ error: "Usuario no encontrado" });
      }

      const existing = db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, safe)).get();
      if (existing && existing.id !== id) {
        return reply.status(409).send({ error: "El usuario ya existe" });
      }

      db.update(schema.adminUsers).set({ username: safe }).where(eq(schema.adminUsers.id, id)).run();
      return { success: true };
    }
  );

  // Delete user (admin only, blocked for demo)
  app.delete<{ Params: { id: string } }>(
    "/api/users/:id",
    { preHandler: [requireAuth, requireAdminRole] },
    async (req, reply) => {
      const id = parseIdParam(req.params.id, reply);
      if (!id) return;
      
      // Prevent deleting yourself
      if (id === (req as any).userId) {
        return reply.status(403).send({ error: "No puedes eliminarte a ti mismo" });
      }

      const user = db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id)).get();
      if (!user) {
        return reply.status(404).send({ error: "Usuario no encontrado" });
      }

      // Ensure at least one real admin remains if trying to delete an admin
      if (user.role === "admin") {
        const adminCount = db.select().from(schema.adminUsers)
          .where(eq(schema.adminUsers.role, "admin"))
          .all().length;
        if (adminCount <= 1) {
          return reply.status(403).send({ error: "Debe existir al menos un administrador" });
        }
      }

      db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, id)).run();
      return { success: true };
    }
  );
}

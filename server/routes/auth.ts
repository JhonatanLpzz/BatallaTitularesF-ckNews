import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import config from "../config.js";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const JWT_SECRET = config.jwtSecret;
const SESSION_DURATION = config.sessionDuration;

async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

function createSessionToken(): string {
  return nanoid(48);
}

function getExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

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

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = await validateSession(token);
  if (!userId) {
    return reply.status(401).send({ error: "No autorizado" });
  }
  (req as any).userId = userId;
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

      return { token, username: user.username, expiresAt };
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

    return { username: user.username };
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
      if (!username || !password || password.length < 4) {
        return reply.status(400).send({ error: "Usuario y contraseña (min 4 chars) requeridos" });
      }

      const passwordHash = await hashPassword(password);
      db.insert(schema.adminUsers)
        .values({ username, passwordHash })
        .run();

      return { success: true, message: "Administrador creado" };
    }
  );

  // Check if setup is needed
  app.get("/api/auth/needs-setup", async () => {
    const existing = db.select().from(schema.adminUsers).all();
    return { needsSetup: existing.length === 0 };
  });

  // List all users (admin only)
  app.get("/api/users", { preHandler: requireAuth }, async () => {
    const users = db.select({ id: schema.adminUsers.id, username: schema.adminUsers.username, createdAt: schema.adminUsers.createdAt })
      .from(schema.adminUsers)
      .orderBy(schema.adminUsers.id)
      .all();
    return users;
  });

  // Create new user (admin only)
  app.post<{ Body: { username: string; password: string } }>(
    "/api/users",
    { preHandler: requireAuth },
    async (req, reply) => {
      const { username, password } = req.body;
      
      if (!username?.trim() || !password || password.length < 4) {
        return reply.status(400).send({ error: "Usuario y contraseña (min 4 chars) requeridos" });
      }

      const existing = db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, username.trim())).get();
      if (existing) {
        return reply.status(409).send({ error: "El usuario ya existe" });
      }

      const passwordHash = await hashPassword(password);
      const user = db.insert(schema.adminUsers)
        .values({ username: username.trim(), passwordHash })
        .returning({ id: schema.adminUsers.id, username: schema.adminUsers.username, createdAt: schema.adminUsers.createdAt })
        .get();

      return user;
    }
  );

  // Update user password (admin only)
  app.patch<{ Params: { id: string }; Body: { password: string } }>(
    "/api/users/:id/password",
    { preHandler: requireAuth },
    async (req, reply) => {
      const id = parseInt(req.params.id);
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

  // Update username (admin only)
  app.patch<{ Params: { id: string }; Body: { username: string } }>(
    "/api/users/:id/username",
    { preHandler: requireAuth },
    async (req, reply) => {
      const id = parseInt(req.params.id);
      const { username } = req.body;

      if (!username?.trim()) {
        return reply.status(400).send({ error: "Usuario requerido" });
      }

      const user = db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id)).get();
      if (!user) {
        return reply.status(404).send({ error: "Usuario no encontrado" });
      }

      const existing = db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, username.trim())).get();
      if (existing && existing.id !== id) {
        return reply.status(409).send({ error: "El usuario ya existe" });
      }

      db.update(schema.adminUsers).set({ username: username.trim() }).where(eq(schema.adminUsers.id, id)).run();
      return { success: true };
    }
  );

  // Delete user (admin only)
  app.delete<{ Params: { id: string } }>(
    "/api/users/:id",
    { preHandler: requireAuth },
    async (req, reply) => {
      const id = parseInt(req.params.id);
      
      // Prevent deleting yourself
      if (id === (req as any).userId) {
        return reply.status(403).send({ error: "No puedes eliminarte a ti mismo" });
      }

      const user = db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id)).get();
      if (!user) {
        return reply.status(404).send({ error: "Usuario no encontrado" });
      }

      // Ensure at least one admin remains
      const count = db.select().from(schema.adminUsers).all().length;
      if (count <= 1) {
        return reply.status(403).send({ error: "Debe existir al menos un administrador" });
      }

      db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, id)).run();
      return { success: true };
    }
  );
}

/**
 * @fileoverview Esquema Drizzle ORM para la base de datos SQLite.
 *
 * Tablas:
 * - {@link adminUsers} — Administradores del sistema
 * - {@link sessions} — Sesiones JWT activas
 * - {@link battles} — Batallas/competencias de titulares
 * - {@link participants} — Participantes por batalla
 * - {@link votes} — Votos del público con info del votante
 *
 * Relaciones: `sessions.userId → adminUsers.id`,
 * `participants.battleId → battles.id`, `votes.battleId → battles.id`,
 * `votes.participantId → participants.id`. Cascade delete habilitado.
 *
 * @module server/db/schema
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Tabla de administradores del sistema.
 * Almacena credenciales hasheadas con bcrypt.
 */
export const adminUsers = sqliteTable("admin_users", {
  /** ID autoincremental. */
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Nombre de usuario único. */
  username: text("username").notNull().unique(),
  /** Hash bcrypt de la contraseña. */
  passwordHash: text("password_hash").notNull(),
  /** Rol del usuario: `admin` (control total) o `demo` (solo lectura). */
  role: text("role", { enum: ["admin", "demo"] }).notNull().default("admin"),
  /** Timestamp ISO de creación. */
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Tabla de sesiones de autenticación.
 * Los tokens se generan con nanoid(48) y expiran a los 7 días.
 */
export const sessions = sqliteTable("sessions", {
  /** ID autoincremental. */
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Token de sesión único (nanoid 48 chars). */
  token: text("token").notNull().unique(),
  /** FK al administrador propietario de la sesión. */
  userId: integer("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  /** Timestamp ISO de expiración del token. */
  expiresAt: text("expires_at").notNull(),
});

/**
 * Tabla de batallas/competencias.
 * Estados posibles: `draft` → `active` → `closed` | `tied` → `tiebreaker` → `closed`.
 */
export const battles = sqliteTable("battles", {
  /** ID autoincremental. */
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Código corto único para URLs públicas (nanoid 8 chars). */
  code: text("code").notNull().unique(),
  /** Título visible de la batalla. */
  title: text("title").notNull(),
  /** Descripción opcional. */
  description: text("description"),
  /** Estado actual del ciclo de vida de la batalla. */
  status: text("status", { enum: ["draft", "active", "closed", "tied", "tiebreaker"] })
    .notNull()
    .default("draft"),
  /** Duración en minutos (`null` = sin límite de tiempo). */
  durationMinutes: integer("duration_minutes"),
  /** Timestamp ISO de cuando se activó la batalla. */
  activatedAt: text("activated_at"),
  /** JSON array con IDs de participantes empatados (cuando `status = 'tied'`). */
  tiedParticipantIds: text("tied_participant_ids"),
  /** Número de ronda de desempate actual (0 = sin desempate). */
  tiebreakRound: integer("tiebreak_round").default(0),
  /** ID del participante ganador (establecido al cerrar). */
  winnerId: integer("winner_id"),
  /** Timestamp ISO de creación. */
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Tabla de participantes.
 * Cada batalla tiene al menos 2 participantes. Se eliminan en cascada con la batalla.
 */
export const participants = sqliteTable("participants", {
  /** ID autoincremental. */
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** FK a la batalla a la que pertenece. */
  battleId: integer("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  /** Nombre del participante (ej: "Camilo Pardo 'El Mago'"). */
  name: text("name").notNull(),
  /** Titular/noticia con el que compite. */
  headline: text("headline").notNull(),
  /** URL del avatar (opcional). */
  avatarUrl: text("avatar_url"),
  /** Color hexadecimal asignado (ej: "#dc2626"). */
  color: text("color").notNull().default("#1a56a8"),
  /** Posición de ordenamiento (0-based). */
  position: integer("position").notNull().default(0),
});

/**
 * Tabla de votos del público.
 * Índice único `(battle_id, fingerprint)` previene votos duplicados por dispositivo.
 */
export const votes = sqliteTable("votes", {
  /** ID autoincremental. */
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** FK a la batalla votada. */
  battleId: integer("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  /** FK al participante elegido. */
  participantId: integer("participant_id")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  /** Nombre completo del votante (obligatorio). */
  voterName: text("voter_name").notNull(),
  /** Documento de identidad del votante (opcional). */
  voterDocument: text("voter_document"),
  /** Número de celular del votante (opcional). */
  voterPhone: text("voter_phone"),
  /** Fingerprint único del dispositivo (para prevenir duplicados). */
  fingerprint: text("fingerprint").notNull(),
  /** Timestamp ISO del momento del voto. */
  votedAt: text("voted_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Tipos inferidos de Drizzle
// ---------------------------------------------------------------------------

/** Tipo inferido de un registro `admin_users` (SELECT). */
export type AdminUser = typeof adminUsers.$inferSelect;
/** Tipo inferido de un registro `battles` (SELECT). */
export type Battle = typeof battles.$inferSelect;
/** Tipo inferido para insertar en `battles` (INSERT). */
export type NewBattle = typeof battles.$inferInsert;
/** Tipo inferido de un registro `participants` (SELECT). */
export type Participant = typeof participants.$inferSelect;
/** Tipo inferido para insertar en `participants` (INSERT). */
export type NewParticipant = typeof participants.$inferInsert;
/** Tipo inferido de un registro `votes` (SELECT). */
export type Vote = typeof votes.$inferSelect;

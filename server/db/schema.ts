import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
});

export const battles = sqliteTable("battles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["draft", "active", "closed"] })
    .notNull()
    .default("draft"),
  durationMinutes: integer("duration_minutes"),
  activatedAt: text("activated_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const participants = sqliteTable("participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  battleId: integer("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  headline: text("headline").notNull(),
  avatarUrl: text("avatar_url"),
  color: text("color").notNull().default("#1a56a8"),
  position: integer("position").notNull().default(0),
});

export const votes = sqliteTable("votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  battleId: integer("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  participantId: integer("participant_id")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  voterName: text("voter_name").notNull(),
  voterDocument: text("voter_document"),
  voterPhone: text("voter_phone"),
  fingerprint: text("fingerprint").notNull(),
  votedAt: text("voted_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type Battle = typeof battles.$inferSelect;
export type NewBattle = typeof battles.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type Vote = typeof votes.$inferSelect;

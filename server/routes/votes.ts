/**
 * @fileoverview Rutas de votación pública y verificación de votos.
 *
 * Endpoints:
 * - `POST /api/votes` — Registrar un voto nuevo (con info del votante)
 * - `PUT  /api/votes` — Cambiar un voto existente a otro participante
 * - `GET  /api/votes/check/:code?fp=` — Verificar si un dispositivo ya votó
 *
 * Cada voto registrado dispara un broadcast SSE a todos los clientes
 * suscritos a la batalla correspondiente.
 *
 * @module server/routes/votes
 */

import type { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and, sql } from "drizzle-orm";
import { publishBattleVoteUpdate } from "../realtime/publisher.js";
import { sanitizeText } from "../lib/validation.js";
import config from "../config.js";

// ---------------------------------------------------------------------------
// In-memory rate limiter (sliding window per fingerprint)
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, number[]>();

function isRateLimited(fingerprint: string): boolean {
  const now = Date.now();
  const windowMs = config.rateLimitWindow;
  const maxRequests = config.rateLimitVotes;

  const timestamps = (rateLimitMap.get(fingerprint) ?? []).filter(
    (ts) => now - ts < windowMs
  );

  if (timestamps.length >= maxRequests) return true;

  timestamps.push(now);
  rateLimitMap.set(fingerprint, timestamps);
  return false;
}

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap.entries()) {
    if (timestamps.every((ts) => now - ts >= config.rateLimitWindow)) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ---------------------------------------------------------------------------
// Optimized vote counts using single JOIN query (eliminates N+1)
// ---------------------------------------------------------------------------

/**
 * Calcula conteos y porcentajes de votos usando una sola query con JOIN.
 * Elimina el problema N+1 de la implementación anterior.
 * @param battleId - ID de la batalla.
 * @returns Participantes con métricas de votación y total de votos.
 */
function getVoteCounts(battleId: number) {
  const rows = db
    .select({
      id: schema.participants.id,
      battleId: schema.participants.battleId,
      name: schema.participants.name,
      headline: schema.participants.headline,
      avatarUrl: schema.participants.avatarUrl,
      color: schema.participants.color,
      position: schema.participants.position,
      votes: sql<number>`COUNT(${schema.votes.id})`,
    })
    .from(schema.participants)
    .leftJoin(schema.votes, eq(schema.votes.participantId, schema.participants.id))
    .where(eq(schema.participants.battleId, battleId))
    .groupBy(schema.participants.id)
    .orderBy(schema.participants.position)
    .all();

  const totalVotes = rows.reduce((sum, p) => sum + Number(p.votes), 0);

  return {
    participants: rows.map((p) => ({
      ...p,
      votes: Number(p.votes),
      percentage: totalVotes > 0 ? Math.round((Number(p.votes) / totalVotes) * 100) : 0,
    })),
    totalVotes,
  };
}

export async function voteRoutes(app: FastifyInstance) {
  // Cast a vote
  app.post<{
    Body: {
      battleCode: string;
      participantId: number;
      fingerprint: string;
      voterName: string;
      voterDocument?: string;
      voterPhone?: string;
    };
  }>("/api/votes", async (req, reply) => {
    const { battleCode, participantId, fingerprint, voterName, voterDocument, voterPhone } = req.body;

    if (!battleCode || !participantId || !fingerprint) {
      return reply.status(400).send({ error: "Datos de voto incompletos" });
    }

    if (isRateLimited(fingerprint)) {
      return reply.status(429).send({ error: "Demasiados intentos. Espera un momento antes de votar de nuevo." });
    }

    const battle = db
      .select()
      .from(schema.battles)
      .where(eq(schema.battles.code, battleCode))
      .get();

    if (!battle) {
      return reply.status(404).send({ error: "Batalla no encontrada" });
    }

    if (battle.status !== "active") {
      return reply.status(403).send({ error: "La votación no está activa" });
    }

    // Check if timer expired (auto-close)
    if (battle.durationMinutes && battle.activatedAt) {
      const expiresMs = new Date(battle.activatedAt).getTime() + battle.durationMinutes * 60 * 1000;
      if (Date.now() >= expiresMs) {
        db.update(schema.battles)
          .set({ status: "closed" })
          .where(eq(schema.battles.id, battle.id))
          .run();
        return reply.status(403).send({ error: "El tiempo de votación ha terminado" });
      }
    }

    // Check if already voted
    const existing = db
      .select()
      .from(schema.votes)
      .where(
        and(
          eq(schema.votes.battleId, battle.id),
          eq(schema.votes.fingerprint, fingerprint)
        )
      )
      .get();

    if (existing) {
      return reply.status(409).send({ error: "Ya votaste en esta batalla" });
    }

    // Verify participant belongs to this battle
    const participant = db
      .select()
      .from(schema.participants)
      .where(
        and(
          eq(schema.participants.id, participantId),
          eq(schema.participants.battleId, battle.id)
        )
      )
      .get();

    if (!participant) {
      return reply.status(400).send({ error: "Participante no válido" });
    }

    const safeName = voterName?.trim() ? sanitizeText(voterName, 100) : "Anónimo";

    db.insert(schema.votes)
      .values({
        battleId: battle.id,
        participantId,
        fingerprint: fingerprint.slice(0, 128),
        voterName: safeName,
        voterDocument: voterDocument?.trim() ? sanitizeText(voterDocument, 30) : null,
        voterPhone: voterPhone?.trim() ? sanitizeText(voterPhone, 20) : null,
      })
      .run();

    // Broadcast updated counts to battle room (WebSocket)
    const counts = getVoteCounts(battle.id);
    publishBattleVoteUpdate(battleCode, { type: "vote_update", ...counts });

    return { success: true, message: "¡Voto registrado!" };
  });

  app.put<{
    Body: {
      battleCode: string;
      participantId: number;
      fingerprint: string;
    };
  }>("/api/votes", async (req, reply) => {
    const { battleCode, participantId, fingerprint } = req.body;

    if (!battleCode || !participantId || !fingerprint) {
      return reply.status(400).send({ error: "Datos de voto incompletos" });
    }

    const battle = db
      .select()
      .from(schema.battles)
      .where(eq(schema.battles.code, battleCode))
      .get();

    if (!battle) {
      return reply.status(404).send({ error: "Batalla no encontrada" });
    }

    if (battle.status !== "active" && battle.status !== "tiebreaker") {
      return reply.status(403).send({ error: "La votación no está activa" });
    }

    const existing = db
      .select()
      .from(schema.votes)
      .where(
        and(
          eq(schema.votes.battleId, battle.id),
          eq(schema.votes.fingerprint, fingerprint)
        )
      )
      .get();

    if (!existing) {
      return reply.status(404).send({ error: "No existe un voto previo para actualizar" });
    }

    const participant = db
      .select()
      .from(schema.participants)
      .where(
        and(
          eq(schema.participants.id, participantId),
          eq(schema.participants.battleId, battle.id)
        )
      )
      .get();

    if (!participant) {
      return reply.status(400).send({ error: "Participante no válido" });
    }

    db.update(schema.votes)
      .set({ participantId })
      .where(eq(schema.votes.id, existing.id))
      .run();

    const counts = getVoteCounts(battle.id);
    publishBattleVoteUpdate(battleCode, { type: "vote_update", ...counts });

    return { success: true, message: "Voto actualizado" };
  });

  // Check if user already voted
  app.get<{ Params: { code: string }; Querystring: { fp: string } }>(
    "/api/votes/check/:code",
    async (req, reply) => {
      const { code } = req.params;
      const { fp } = req.query;

      const battle = db
        .select()
        .from(schema.battles)
        .where(eq(schema.battles.code, code))
        .get();

      if (!battle) {
        return reply.status(404).send({ error: "Batalla no encontrada" });
      }

      const existing = db
        .select()
        .from(schema.votes)
        .where(
          and(
            eq(schema.votes.battleId, battle.id),
            eq(schema.votes.fingerprint, fp)
          )
        )
        .get();

      return {
        hasVoted: !!existing,
        participantId: existing?.participantId ?? null,
      };
    }
  );
}

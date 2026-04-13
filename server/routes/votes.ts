import type { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { broadcastToBattle } from "../sse.js";

function getVoteCounts(battleId: number) {
  const battleParticipants = db
    .select()
    .from(schema.participants)
    .where(eq(schema.participants.battleId, battleId))
    .orderBy(schema.participants.position)
    .all();

  const voteCounts: Record<number, number> = {};
  for (const p of battleParticipants) {
    voteCounts[p.id] = db
      .select()
      .from(schema.votes)
      .where(eq(schema.votes.participantId, p.id))
      .all().length;
  }

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  return {
    participants: battleParticipants.map((p) => ({
      ...p,
      votes: voteCounts[p.id] || 0,
      percentage: totalVotes > 0 ? Math.round(((voteCounts[p.id] || 0) / totalVotes) * 100) : 0,
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

    if (!battleCode || !participantId || !fingerprint || !voterName?.trim()) {
      return reply.status(400).send({ error: "El nombre es obligatorio" });
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

    // Check if timer expired
    if (battle.durationMinutes && battle.activatedAt) {
      const expiresMs = new Date(battle.activatedAt).getTime() + battle.durationMinutes * 60 * 1000;
      if (Date.now() >= expiresMs) {
        db.update(schema.battles).set({ status: "closed" }).where(eq(schema.battles.id, battle.id)).run();
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

    db.insert(schema.votes)
      .values({
        battleId: battle.id,
        participantId,
        fingerprint,
        voterName: voterName.trim(),
        voterDocument: voterDocument?.trim() || null,
        voterPhone: voterPhone?.trim() || null,
      })
      .run();

    // Broadcast updated counts
    const counts = getVoteCounts(battle.id);
    broadcastToBattle(battle.id, { type: "vote_update", ...counts });

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
    broadcastToBattle(battle.id, { type: "vote_update", ...counts });

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

import type { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { requireAuth } from "./auth.js";

function isBattleExpired(battle: { status: string; durationMinutes: number | null; activatedAt: string | null }): boolean {
  if (!["active", "tiebreaker"].includes(battle.status) || !battle.durationMinutes || !battle.activatedAt) return false;
  const activatedMs = new Date(battle.activatedAt).getTime();
  const expiresMs = activatedMs + battle.durationMinutes * 60 * 1000;
  return Date.now() >= expiresMs;
}

function detectTieWinners(battleId: number): number[] {
  const participants = db.select().from(schema.participants).where(eq(schema.participants.battleId, battleId)).all();
  if (participants.length === 0) return [];
  const counts: Record<number, number> = {};
  for (const p of participants) {
    counts[p.id] = db.select().from(schema.votes).where(eq(schema.votes.participantId, p.id)).all().length;
  }
  const max = Math.max(...Object.values(counts));
  if (max === 0) return [];
  return participants.filter(p => counts[p.id] === max).map(p => p.id);
}

function autoCloseIfExpired(battle: { id: number; status: string; durationMinutes: number | null; activatedAt: string | null }) {
  if (!isBattleExpired(battle)) return false;
  const tiedIds = detectTieWinners(battle.id);
  if (tiedIds.length > 1) {
    db.update(schema.battles)
      .set({ status: "tied", tiedParticipantIds: JSON.stringify(tiedIds) })
      .where(eq(schema.battles.id, battle.id))
      .run();
  } else {
    const winnerId = tiedIds[0] ?? null;
    db.update(schema.battles)
      .set({ status: "closed", winnerId })
      .where(eq(schema.battles.id, battle.id))
      .run();
  }
  return true;
}

export async function battleRoutes(app: FastifyInstance) {
  // List all battles (admin only)
  app.get("/api/battles", { preHandler: requireAuth }, async () => {
    const allBattles = db.select().from(schema.battles).orderBy(schema.battles.createdAt).all();
    
    // Calculate expiresAt for each battle like the public route does
    return allBattles.map(battle => {
      let expiresAt: string | null = null;
      if (battle.durationMinutes && battle.activatedAt) {
        const exp = new Date(new Date(battle.activatedAt).getTime() + battle.durationMinutes * 60 * 1000);
        expiresAt = exp.toISOString();
      }
      
      return {
        ...battle,
        expiresAt
      };
    });
  });

  // Get single battle with participants and vote counts (public)
  app.get<{ Params: { code: string } }>("/api/battles/:code", async (req, reply) => {
    const { code } = req.params;

    const battle = db
      .select()
      .from(schema.battles)
      .where(eq(schema.battles.code, code))
      .get();

    if (!battle) {
      return reply.status(404).send({ error: "Batalla no encontrada" });
    }

    const battleParticipants = db
      .select()
      .from(schema.participants)
      .where(eq(schema.participants.battleId, battle.id))
      .orderBy(schema.participants.position)
      .all();

    const voteCounts: Record<number, number> = {};
    for (const p of battleParticipants) {
      const count = db
        .select()
        .from(schema.votes)
        .where(eq(schema.votes.participantId, p.id))
        .all().length;
      voteCounts[p.id] = count;
    }

    const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

    // Auto-close if timer expired, then re-read actual status (may be "tied" or "closed")
    const expired = autoCloseIfExpired(battle);
    const currentStatus = expired
      ? (db.select().from(schema.battles).where(eq(schema.battles.id, battle.id)).get()?.status ?? "closed")
      : battle.status;

    // Calculate time remaining
    let expiresAt: string | null = null;
    if (battle.durationMinutes && battle.activatedAt) {
      const exp = new Date(new Date(battle.activatedAt).getTime() + battle.durationMinutes * 60 * 1000);
      expiresAt = exp.toISOString();
    }

    // Safely parse tied participant IDs
    let tiedIds: number[] | undefined;
    if (battle.tiedParticipantIds) {
      try {
        tiedIds = JSON.parse(battle.tiedParticipantIds);
      } catch (e) {
        tiedIds = undefined;
      }
    }

    return {
      ...battle,
      status: currentStatus,
      expiresAt,
      tiedParticipantIds: tiedIds,
      participants: battleParticipants.map((p) => ({
        ...p,
        votes: voteCounts[p.id] || 0,
        percentage: totalVotes > 0 ? Math.round(((voteCounts[p.id] || 0) / totalVotes) * 100) : 0,
      })),
      totalVotes,
    };
  });

  // Create battle (admin only)
  app.post<{
    Body: {
      title: string;
      description?: string;
      durationMinutes?: number;
      participants: { name: string; headline: string; color?: string; avatarUrl?: string }[];
    };
  }>("/api/battles", { preHandler: requireAuth }, async (req, reply) => {
    const { title, description, durationMinutes, participants: parts } = req.body;

    if (!title || !parts || parts.length < 2) {
      return reply.status(400).send({ error: "Se necesitan al menos 2 participantes" });
    }

    const code = nanoid(8);

    const battle = db
      .insert(schema.battles)
      .values({
        code,
        title,
        description: description || null,
        durationMinutes: durationMinutes && durationMinutes > 0 ? durationMinutes : null,
      })
      .returning()
      .get();

    const defaultColors = ["#1a56a8", "#dc2626", "#10b981", "#f59e0b", "#7c3aed", "#0891b2"];

    for (let i = 0; i < parts.length; i++) {
      db.insert(schema.participants).values({
        battleId: battle.id,
        name: parts[i].name,
        headline: parts[i].headline,
        color: parts[i].color || defaultColors[i % defaultColors.length],
        avatarUrl: parts[i].avatarUrl || null,
        position: i,
      }).run();
    }

    return reply.status(201).send({ ...battle, code });
  });

  // Update battle status (admin only)
  app.patch<{ Params: { id: string }; Body: { status: "draft" | "active" | "closed" | "tied" | "tiebreaker" } }>(
    "/api/battles/:id/status",
    { preHandler: requireAuth },
    async (req, reply) => {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!["draft", "active", "closed", "tied", "tiebreaker"].includes(status)) {
        return reply.status(400).send({ error: "Estado inválido" });
      }

      const updates: Record<string, unknown> = { status };
      if (status === "active" || status === "tiebreaker") {
        updates.activatedAt = new Date().toISOString();
      }
      db.update(schema.battles).set(updates).where(eq(schema.battles.id, id)).run();
      return { success: true };
    }
  );

  // Start tiebreaker round (admin only) — resets votes for tied participants, activates tiebreaker
  app.post<{ Params: { id: string }; Body: { durationMinutes?: number } }>(
    "/api/battles/:id/tiebreaker",
    { preHandler: requireAuth },
    async (req, reply) => {
      const id = parseInt(req.params.id);
      const battle = db.select().from(schema.battles).where(eq(schema.battles.id, id)).get();
      if (!battle) return reply.status(404).send({ error: "Batalla no encontrada" });
      if (battle.status !== "tied") return reply.status(400).send({ error: "La batalla debe estar en estado de empate" });

      const tiedIds: number[] = battle.tiedParticipantIds ? JSON.parse(battle.tiedParticipantIds) : [];
      for (const participantId of tiedIds) {
        db.delete(schema.votes).where(eq(schema.votes.participantId, participantId)).run();
      }

      db.update(schema.battles)
        .set({
          status: "tiebreaker",
          activatedAt: new Date().toISOString(),
          durationMinutes: req.body.durationMinutes ?? 5,
          tiebreakRound: (battle.tiebreakRound ?? 0) + 1,
        })
        .where(eq(schema.battles.id, id))
        .run();

      return { success: true };
    }
  );

  // Delete battle (admin only)
  app.delete<{ Params: { id: string } }>("/api/battles/:id", { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt(req.params.id);
    db.delete(schema.battles).where(eq(schema.battles.id, id)).run();
    return { success: true };
  });

  // Generate QR code
  app.get<{ Params: { code: string }; Querystring: { base?: string } }>(
    "/api/battles/:code/qr",
    async (req, reply) => {
      const { code } = req.params;
      const base = req.query.base || `${req.protocol}://${req.hostname}`;
      const url = `${base}/votar/${code}`;

      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: { dark: "#09090B", light: "#FAFAFA" },
        errorCorrectionLevel: "H",
      });

      return { qr: qrDataUrl, url };
    }
  );

  // Reset votes for a battle (admin only)
  app.delete<{ Params: { id: string } }>("/api/battles/:id/votes", { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt(req.params.id);
    db.delete(schema.votes).where(eq(schema.votes.battleId, id)).run();
    return { success: true };
  });
}

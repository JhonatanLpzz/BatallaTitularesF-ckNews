/**
 * @fileoverview Endpoint SSE para actualizaciones de votación en tiempo real.
 *
 * Endpoint:
 * - `GET /sse/battles/:code` — Stream SSE por batalla
 *
 * El cliente recibe un evento `connected` con su `clientId` al conectar,
 * y luego eventos `vote_update` cada vez que se registra o cambia un voto.
 *
 * @module server/routes/sse
 */

import type { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { addClient, removeClient } from "../sse.js";
import { nanoid } from "nanoid";

/**
 * Registra el endpoint SSE en la instancia Fastify.
 * @param app - Instancia de Fastify.
 */
export async function sseRoutes(app: FastifyInstance) {
  app.get<{ Params: { code: string } }>("/sse/battles/:code", async (req, reply) => {
    const { code } = req.params;

    const battle = db
      .select()
      .from(schema.battles)
      .where(eq(schema.battles.code, code))
      .get();

    if (!battle) {
      return reply.status(404).send({ error: "Batalla no encontrada" });
    }

    const clientId = nanoid();

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    reply.raw.write(`data: ${JSON.stringify({ type: "connected", clientId })}\n\n`);

    addClient({ id: clientId, battleId: battle.id, reply });

    req.raw.on("close", () => {
      removeClient(clientId);
    });
  });
}

import type { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { and, inArray, sql } from "drizzle-orm";

export async function rankingRoutes(app: FastifyInstance) {
  app.get("/api/rankings/global", async () => {
    const rows = db
      .select({
        participantName: schema.participants.name,
        participantColor: sql<string>`MIN(${schema.participants.color})`,
        totalVotes: sql<number>`COUNT(${schema.votes.id})`,
        battlesParticipated: sql<number>`COUNT(DISTINCT ${schema.participants.battleId})`,
        wins: sql<number>`COUNT(DISTINCT CASE WHEN ${schema.battles.winnerId} = ${schema.participants.id} THEN ${schema.battles.id} END)`,
      })
      .from(schema.participants)
      .leftJoin(schema.votes, and(
        sql`${schema.votes.participantId} = ${schema.participants.id}`,
        sql`${schema.votes.battleId} = ${schema.participants.battleId}`,
      ))
      .leftJoin(schema.battles, sql`${schema.battles.id} = ${schema.participants.battleId}`)
      .where(inArray(schema.battles.status, ["active", "tiebreaker", "closed", "tied"]))
      .groupBy(schema.participants.name)
      .orderBy(
        sql`COUNT(${schema.votes.id}) DESC`,
        sql`COUNT(DISTINCT CASE WHEN ${schema.battles.winnerId} = ${schema.participants.id} THEN ${schema.battles.id} END) DESC`,
        schema.participants.name
      )
      .all();

    return {
      ranking: rows.map((row, index) => ({
        rank: index + 1,
        participantName: row.participantName,
        participantColor: row.participantColor,
        totalVotes: Number(row.totalVotes),
        battlesParticipated: Number(row.battlesParticipated),
        wins: Number(row.wins),
      })),
    };
  });
}

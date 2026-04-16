/**
 * @fileoverview Utilidad de Server-Sent Events (SSE) para broadcast de votos.
 *
 * Gestiona un registro en memoria de clientes SSE conectados y proporciona
 * funciones para agregar, eliminar y enviar eventos a clientes suscritos
 * a una batalla específica.
 *
 * @module server/sse
 */

import type { FastifyReply } from "fastify";

/** Representación de un cliente SSE conectado. */
type SSEClient = {
  /** ID único del cliente (nanoid). */
  id: string;
  /** ID de la batalla a la que está suscrito. */
  battleId: number;
  /** Referencia al reply de Fastify para escribir eventos. */
  reply: FastifyReply;
};

/** Registro en memoria de todos los clientes SSE activos. */
const clients: SSEClient[] = [];

/**
 * Registra un nuevo cliente SSE en el registro global.
 * @param client - Cliente SSE a registrar.
 */
export function addClient(client: SSEClient) {
  clients.push(client);
}

/**
 * Elimina un cliente SSE del registro cuando se desconecta.
 * @param id - ID único del cliente a eliminar.
 */
export function removeClient(id: string) {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx !== -1) clients.splice(idx, 1);
}

/**
 * Envía un evento SSE a todos los clientes suscritos a una batalla.
 * Formato SSE: `data: {json}\n\n`
 * @param battleId - ID de la batalla destino.
 * @param data - Payload del evento (se serializa a JSON).
 */
export function broadcastToBattle(battleId: number, data: unknown) {
  const event = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    if (client.battleId === battleId) {
      client.reply.raw.write(event);
    }
  }
}

/**
 * Cuenta los clientes SSE conectados a una batalla.
 * @param battleId - ID de la batalla.
 * @returns Número de clientes activos.
 */
export function getClientCount(battleId: number): number {
  return clients.filter((c) => c.battleId === battleId).length;
}

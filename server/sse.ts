import type { FastifyReply } from "fastify";

type SSEClient = {
  id: string;
  battleId: number;
  reply: FastifyReply;
};

const clients: SSEClient[] = [];

export function addClient(client: SSEClient) {
  clients.push(client);
}

export function removeClient(id: string) {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx !== -1) clients.splice(idx, 1);
}

export function broadcastToBattle(battleId: number, data: unknown) {
  const event = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    if (client.battleId === battleId) {
      client.reply.raw.write(event);
    }
  }
}

export function getClientCount(battleId: number): number {
  return clients.filter((c) => c.battleId === battleId).length;
}

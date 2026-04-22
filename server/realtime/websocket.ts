import type { FastifyInstance } from "fastify";
import { Server as SocketIOServer } from "socket.io";
import config from "../config.js";
import { setRealtimePublisher } from "./publisher.js";

const DEV_ORIGIN = "http://localhost:5173";

let io: SocketIOServer | null = null;

function battleRoom(code: string): string {
  return `battle:${code}`;
}

export function initWebSocketServer(app: FastifyInstance) {
  io = new SocketIOServer(app.server, {
    path: "/ws/socket.io",
    cors: {
      origin: config.nodeEnv === "production" ? config.corsOrigin : DEV_ORIGIN,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    socket.on("join_battle", (battleCode: string) => {
      if (!battleCode) return;
      socket.join(battleRoom(battleCode));
      socket.emit("connected", {
        type: "connected",
        socketId: socket.id,
        battleCode,
      });
    });

    socket.on("leave_battle", (battleCode: string) => {
      if (!battleCode) return;
      socket.leave(battleRoom(battleCode));
    });
  });

  setRealtimePublisher((battleCode, payload) => {
    emitVoteUpdateToBattleRoom(battleCode, payload);
  });
}

export function emitVoteUpdateToBattleRoom(battleCode: string, payload: unknown) {
  if (!io || !battleCode) return;
  io.to(battleRoom(battleCode)).emit("vote_update", payload);
}

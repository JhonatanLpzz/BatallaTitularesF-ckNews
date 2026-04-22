import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { WS_PATH, WS_RECONNECT_INTERVAL_MS } from "@/constants";

interface WSOptions {
  onMessage: (data: unknown) => void;
  enabled?: boolean;
}

export function useWebSocket(battleCode: string | undefined, options: WSOptions) {
  const { onMessage, enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);

  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!battleCode || !enabled) return;

    socketRef.current?.disconnect();

    const socket = io(window.location.origin, {
      path: WS_PATH,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: WS_RECONNECT_INTERVAL_MS,
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_battle", battleCode);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connected", (data) => {
      onMessageRef.current(data);
    });

    socket.on("vote_update", (data) => {
      onMessageRef.current(data);
    });

    socketRef.current = socket;
  }, [battleCode, enabled]);

  useEffect(() => {
    connect();

    return () => {
      if (battleCode && socketRef.current) {
        socketRef.current.emit("leave_battle", battleCode);
      }
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [battleCode, connect]);

  return { connected };
}

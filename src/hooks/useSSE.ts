/**
 * @fileoverview Hook de Server-Sent Events para actualizaciones de votación en tiempo real.
 * @module hooks/useSSE
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { SSE_ENDPOINT, SSE_RECONNECT_INTERVAL_MS } from "@/constants";

/**
 * Opciones de configuración para el hook SSE.
 */
interface SSEOptions {
  /** Callback invocado con cada mensaje SSE parseado. */
  onMessage: (data: unknown) => void;
  /** Si `false`, la conexión SSE no se establece. @default true */
  enabled?: boolean;
}

/**
 * Hook que establece y gestiona una conexión SSE con el servidor para
 * recibir actualizaciones de votación en tiempo real de una batalla.
 *
 * Características:
 * - Reconexión automática tras errores de red (cada {@link SSE_RECONNECT_INTERVAL_MS} ms).
 * - Referencia estable al callback `onMessage` (no causa re-render al cambiar).
 * - Limpieza automática al desmontar o cambiar de batalla.
 *
 * @param battleCode - Código único de la batalla a observar.
 * @param options - Opciones de configuración ({@link SSEOptions}).
 * @returns `{ connected }` — estado actual de la conexión SSE.
 *
 * @example
 * const { connected } = useSSE(battle.code, {
 *   enabled: battle.status === "active",
 *   onMessage: (data) => updateParticipants(data),
 * });
 */
export function useSSE(battleCode: string | undefined, options: SSEOptions) {
  const { onMessage, enabled = true } = options;
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);

  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!battleCode || !enabled) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(SSE_ENDPOINT(battleCode));

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      setTimeout(connect, SSE_RECONNECT_INTERVAL_MS);
    };

    eventSourceRef.current = es;
  }, [battleCode, enabled]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [connect]);

  return { connected };
}

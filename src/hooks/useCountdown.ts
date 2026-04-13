/**
 * @fileoverview Hook de countdown reactivo para timers de batalla.
 * @module hooks/useCountdown
 */

import { useState, useEffect } from "react";
import { COUNTDOWN_INTERVAL_MS } from "@/constants";

/**
 * Resultado del countdown con tiempo desglosado y estado de expiración.
 */
export interface CountdownResult {
  /** Minutos restantes. */
  minutes: number;
  /** Segundos restantes (0–59). */
  seconds: number;
  /** Total de segundos restantes. */
  totalSeconds: number;
  /** `true` cuando el timer ha llegado a cero. */
  isExpired: boolean;
  /** Representación formateada "MM:SS". */
  display: string;
}

/**
 * Hook que calcula un countdown reactivo hasta una fecha de expiración.
 * Se actualiza cada segundo y devuelve `null` si no hay fecha configurada.
 *
 * @param expiresAt - Timestamp ISO 8601 de expiración, o `null`/`undefined` si no hay timer.
 * @returns Objeto {@link CountdownResult} con el tiempo restante, o `null` si no aplica.
 *
 * @example
 * const countdown = useCountdown(battle.expiresAt);
 * if (countdown?.isExpired) redirectToResults();
 */
export function useCountdown(expiresAt: string | null | undefined): CountdownResult | null {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }

    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };

    calc();
    const interval = setInterval(calc, COUNTDOWN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (remaining === null) return null;

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    minutes,
    seconds,
    totalSeconds,
    isExpired: totalSeconds <= 0,
    display: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  };
}

/**
 * @fileoverview Timer de countdown para la vista pública de votación.
 * Redirige a resultados automáticamente cuando el timer expira.
 * @module components/VoteTimer
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Timer } from "lucide-react";

import { useCountdown } from "@/hooks/useCountdown";
import { ROUTES, TIMER_REDIRECT_DELAY_MS } from "@/constants";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VoteTimerProps {
  /** Timestamp ISO de expiración de la batalla. */
  expiresAt?: string | null;
  /** Indica si el timer ya expiró (estado del componente padre). */
  expired: boolean;
  /** Callback invocado cuando el timer expira por primera vez. */
  onExpire: () => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Componente de countdown visible para el público durante la votación.
 * Muestra el tiempo restante en formato "MM:SS" y redirige automáticamente
 * a la página de resultados cuando el timer expira.
 *
 * @param props - {@link VoteTimerProps}
 */
export function VoteTimer({ expiresAt, expired, onExpire }: VoteTimerProps) {
  const countdown = useCountdown(expiresAt || "");
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown?.isExpired && !expired) {
      onExpire();
      setTimeout(() => {
        if (code) navigate(ROUTES.RESULTS(code));
      }, TIMER_REDIRECT_DELAY_MS);
    }
  }, [countdown, expired, onExpire, code, navigate]);

  if (!expiresAt) return null;

  return (
    <div className="pl-4 border-l border-white/10 flex flex-col items-end">
      <span className="text-[9px] uppercase tracking-[0.2em]">Cierra en</span>
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4 text-destructive animate-pulse" />
        <span className="text-2xl font-black font-mono text-destructive tabular-nums tracking-tighter leading-none">
          {countdown?.isExpired || expired ? "FINAL" : countdown?.display || "00:00"}
        </span>
      </div>
    </div>
  );
}

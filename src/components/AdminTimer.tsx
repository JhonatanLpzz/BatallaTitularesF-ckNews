/**
 * @fileoverview Timer de countdown para el panel admin de batallas.
 * Muestra el tiempo restante y dispara actualización de estado al expirar.
 * @module components/AdminTimer
 */

import { useState, useEffect } from "react";

import { useCountdown } from "@/hooks/useCountdown";
import { battleService } from "@/services/api";
import type { Battle } from "@/types";
import type { BattleStatusType } from "@/constants";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdminTimerProps {
  /** Timestamp ISO de expiración de la batalla. */
  expiresAt: string | null | undefined;
  /** ID numérico de la batalla. */
  battleId: number;
  /** Lista actual de batallas (para buscar el código por ID). */
  battles: Battle[];
  /** Callback para actualizar el estado de la batalla en la lista padre. */
  onStatusUpdate: (battleId: number, newStatus: BattleStatusType) => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Componente de countdown para batallas activas en el panel admin.
 * Cuando el timer expira, consulta el backend para obtener el estado real
 * (puede ser "closed" o "tied") y notifica al componente padre.
 *
 * @param props - {@link AdminTimerProps}
 */
export function AdminTimer({ expiresAt, battleId, battles, onStatusUpdate }: AdminTimerProps) {
  const countdown = useCountdown(expiresAt || "");
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (countdown?.isExpired && !hasTriggered) {
      setHasTriggered(true);

      const updateBattleStatus = async () => {
        try {
          const battle = battles.find((b) => b.id === battleId);
          if (!battle) return;

          const updatedBattle = await battleService.getByCode(battle.code);
          onStatusUpdate(battleId, updatedBattle.status);
        } catch (error) {
          console.error("Error al actualizar estado de batalla:", error);
        }
      };

      updateBattleStatus();
    }
  }, [countdown?.isExpired, hasTriggered, battleId, battles, onStatusUpdate]);

  return (
    <span className="font-mono text-destructive tabular-nums tracking-tighter leading-none">
      {countdown?.isExpired ? "FINAL" : countdown?.display || "00:00"}
    </span>
  );
}

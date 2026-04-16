import { useEffect, useRef, useCallback } from "react";
import type { Battle } from "@/types";
import { battleService } from "@/services/api";

interface BattleStatusMonitorProps {
  battles: Battle[];
  onUpdate?: (updatedBattle: Battle) => void;
  intervalMs?: number;
}

export function useBattleStatusMonitor({ 
  battles, 
  onUpdate, 
  intervalMs = 5000
}: BattleStatusMonitorProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<Record<number, number>>({});

  /**
   * Verifica batallas expiradas y notifica cambios de estado.
   * @param skipThrottle - `true` omite el throttle de 30s (forceCheck).
   */
  const checkBattleStatuses = useCallback(async (skipThrottle = false) => {
    const activeBattles = battles.filter(b => 
      ["active", "tiebreaker"].includes(b.status) && b.expiresAt
    );
    if (activeBattles.length === 0) return;

    const now = Date.now();

    for (const battle of activeBattles) {
      if (!battle.expiresAt) continue;

      const isExpired = now >= new Date(battle.expiresAt).getTime();
      const recentlyChecked = lastCheckRef.current[battle.id] && 
        now - lastCheckRef.current[battle.id] < 30000;

      if (!isExpired || (!skipThrottle && recentlyChecked)) continue;

      lastCheckRef.current[battle.id] = now;

      try {
        const updatedBattle = await battleService.getByCode(battle.code);
        if (updatedBattle.status !== battle.status) {
          onUpdate?.(updatedBattle);
        }
      } catch (error) {
        console.error("Error verificando estado de batalla:", error);
      }
    }
  }, [battles, onUpdate]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => checkBattleStatuses(false), intervalMs);
    checkBattleStatuses(false);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkBattleStatuses, intervalMs]);

  const forceCheck = useCallback(() => {
    checkBattleStatuses(true);
  }, [checkBattleStatuses]);

  return { forceCheck };
}

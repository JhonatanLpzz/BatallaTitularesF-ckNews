import { useEffect, useRef } from "react";
import type { Battle } from "@/types";

interface BattleStatusMonitorProps {
  battles: Battle[];
  onUpdate?: (updatedBattle: Battle) => void;
  intervalMs?: number;
}

export function useBattleStatusMonitor({ 
  battles, 
  onUpdate, 
  intervalMs = 5000 // Revisar cada 5 segundos
}: BattleStatusMonitorProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<Record<number, number>>({});

  useEffect(() => {
    const checkBattleStatuses = async () => {
      const activeBattles = battles.filter(b => 
        ["active", "tiebreaker"].includes(b.status) && 
        b.expiresAt
      );

      if (activeBattles.length === 0) return;

      const now = Date.now();
      
      for (const battle of activeBattles) {
        if (!battle.expiresAt) continue;
        
        const expiresAt = new Date(battle.expiresAt).getTime();
        const isExpired = now >= expiresAt;
        
        // Solo verificar si ha expirado y no hemos verificado recientemente
        if (isExpired && (!lastCheckRef.current[battle.id] || 
            now - lastCheckRef.current[battle.id] > 30000)) { // 30 segundos entre verificaciones
          
          lastCheckRef.current[battle.id] = now;
          
          try {
            // Llamar a la API para obtener el estado actualizado
            const response = await fetch(`/api/battles/${battle.code}`);
            if (response.ok) {
              const updatedBattle = await response.json();
              
              // Si el estado cambió, notificar
              if (updatedBattle.status !== battle.status) {
                onUpdate?.(updatedBattle);
              }
            }
          } catch (error) {
            console.error("Error verificando estado de batalla:", error);
          }
        }
      }
    };

    // Limpiar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Configurar nuevo intervalo
    intervalRef.current = setInterval(checkBattleStatuses, intervalMs);

    // Verificar inmediatamente
    checkBattleStatuses();

    // Limpieza
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [battles, onUpdate, intervalMs]);

  // Función para forzar verificación manual
  const forceCheck = () => {
    const checkBattleStatuses = async () => {
      const activeBattles = battles.filter(b => 
        ["active", "tiebreaker"].includes(b.status) && 
        b.expiresAt
      );

      const now = Date.now();
      
      for (const battle of activeBattles) {
        if (!battle.expiresAt) continue;
        
        const expiresAt = new Date(battle.expiresAt).getTime();
        const isExpired = now >= expiresAt;
        
        if (isExpired) {
          lastCheckRef.current[battle.id] = now;
          
          try {
            const response = await fetch(`/api/battles/${battle.code}`);
            if (response.ok) {
              const updatedBattle = await response.json();
              if (updatedBattle.status !== battle.status) {
                onUpdate?.(updatedBattle);
              }
            }
          } catch (error) {
            console.error("Error verificando estado de batalla:", error);
          }
        }
      }
    };

    checkBattleStatuses();
  };

  return { forceCheck };
}

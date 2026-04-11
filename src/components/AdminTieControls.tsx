import { useState } from "react";
import { Zap, AlertTriangle, RefreshCw, Crown, Play } from "lucide-react";
import { toast } from "sonner";
import { Battle } from "../types";
import { detectTie, getTieSummary } from "../utils/battleUtils";

interface AdminTieControlsProps {
  battle: Battle;
  onStatusUpdate: (battleId: number, newStatus: Battle["status"]) => void;
  token: string;
}

export function AdminTieControls({ battle, onStatusUpdate, token }: AdminTieControlsProps) {
  const [loading, setLoading] = useState(false);

  const tieDetection = detectTie(battle.participants || []);

  const checkTie = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/battles/${battle.id}/check-tie`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al verificar empate");
      }

      const result = await res.json();
      toast.success(result.message);
      
      // Update local state based on result
      if (result.hasTie) {
        onStatusUpdate(battle.id, "tied");
      } else {
        onStatusUpdate(battle.id, "closed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al verificar empate");
    } finally {
      setLoading(false);
    }
  };

  const startTiebreaker = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/battles/${battle.id}/tiebreaker`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al iniciar desempate");
      }

      const result = await res.json();
      toast.success(result.message);
      onStatusUpdate(battle.id, "tiebreaker");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al iniciar desempate");
    } finally {
      setLoading(false);
    }
  };

  const forceTieState = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/battles/${battle.id}/status`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "tied" })
      });

      if (!res.ok) throw new Error("Error al forzar empate");

      toast.success("Estado cambiado a empate");
      onStatusUpdate(battle.id, "tied");
    } catch (error) {
      toast.error("Error al forzar empate");
    } finally {
      setLoading(false);
    }
  };

  // Don't show controls for draft battles
  if (battle.status === "draft") {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Tie Detection Status */}
      {battle.status === "closed" && tieDetection.hasTie && (
        <div className="fn-card p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 mb-1">¡Empate Detectado!</h4>
              <p className="text-sm text-yellow-700 mb-3">
                {getTieSummary(battle)}
              </p>
              <button
                onClick={forceTieState}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Marcar como Empate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Tie State */}
      {battle.status === "tied" && (
        <div className="fn-card p-4 bg-orange-50 border-orange-200">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-800 mb-1">Batalla Empatada</h4>
              <p className="text-sm text-orange-700 mb-3">
                {getTieSummary(battle)}
              </p>
              <button
                onClick={startTiebreaker}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Iniciar Desempate (5 min)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Tiebreaker */}
      {battle.status === "tiebreaker" && (
        <div className="fn-card p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 mb-1">
                Desempate Activo - Ronda {battle.tiebreakRound || 1}
              </h4>
              <p className="text-sm text-red-700 mb-3">
                {getTieSummary(battle)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={checkTie}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  Verificar Resultado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Controls */}
      {battle.status === "active" && (
        <div className="fn-card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-1">Controles Manuales</h4>
              <p className="text-sm text-blue-700 mb-3">
                Verifica empates o fuerza estados específicos si es necesario.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={checkTie}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Verificar Empate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Standings Preview */}
      {tieDetection.hasTie && battle.participants && (
        <div className="fn-card p-4">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Estado Actual
          </h4>
          <div className="space-y-2">
            {tieDetection.tiedParticipants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-2 bg-yellow-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: participant.color }}
                  />
                  <span className="font-medium">{participant.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{participant.votes} votos</span>
                  <span className="text-yellow-600 font-bold">{participant.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

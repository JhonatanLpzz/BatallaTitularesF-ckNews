import { Clock, Users, Trophy } from "lucide-react";
import { Battle } from "../types";
import { CountdownTimer } from "./CountdownTimer";

interface BattleCardProps {
  battle: Battle;
  onAction: (action: "vote" | "results" | "view") => void;
  showParticipants?: boolean;
}

export function BattleCard({ battle, onAction, showParticipants = true }: BattleCardProps) {
  const getBattleStatusColor = (status: Battle["status"], expiresAt?: string | null) => {
    if (status === "closed") return "opacity-60";
    if (status === "tied") return "border-yellow-500/40 shadow-yellow-500/10";
    if (status === "tiebreaker") return "border-orange-500/60 shadow-orange-500/20 shadow-lg";
    if (status === "active" && expiresAt) {
      const timeLeft = new Date(expiresAt).getTime() - Date.now();
      if (timeLeft < 30000) return "border-orange-400/60 animate-pulse";
      return "border-primary/40";
    }
    return "";
  };

  const getStatusBadge = (status: Battle["status"]) => {
    const badges = {
      draft: { text: "Borrador", color: "bg-muted text-muted-foreground" },
      active: { text: "En Vivo", color: "bg-green-500/20 text-green-400" },
      tied: { text: "Empate", color: "bg-yellow-500/20 text-yellow-400" },
      tiebreaker: { text: "Desempate", color: "bg-orange-500/20 text-orange-400" },
      closed: { text: "Cerrado", color: "bg-muted text-muted-foreground" }
    };
    return badges[status];
  };

  const getActionButton = () => {
    switch (battle.status) {
      case "active":
        return (
          <button
            onClick={() => onAction("vote")}
            className="campaign-button w-full rounded-xl px-6 py-3 text-primary-foreground"
          >
            Votar Ahora
          </button>
        );
      case "tied":
        return (
          <button
            onClick={() => onAction("results")}
            className="w-full border border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 font-semibold rounded-xl px-6 py-3 min-h-[44px] transition-colors"
          >
            Ver Empate
          </button>
        );
      case "tiebreaker":
        return (
          <button
            onClick={() => onAction("vote")}
            className="w-full border border-orange-500/60 bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 font-semibold rounded-xl px-6 py-3 min-h-[44px] transition-colors"
          >
            Votar Desempate
          </button>
        );
      case "closed":
        return (
          <button
            onClick={() => onAction("results")}
            className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-xl px-6 py-3 min-h-[44px] transition-colors"
          >
            Ver Resultados
          </button>
        );
      default:
        return (
          <button
            onClick={() => onAction("view")}
            className="w-full bg-muted text-muted-foreground font-semibold rounded-xl px-6 py-3 min-h-[44px] cursor-not-allowed"
            disabled
          >
            Proximamente
          </button>
        );
    }
  };

  const statusBadge = getStatusBadge(battle.status);
  const statusClass = getBattleStatusColor(battle.status, battle.expiresAt);

  return (
    <div className={`campaign-card p-6 hover:scale-[1.02] transition-all duration-300 border ${statusClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
              {statusBadge.text}
            </span>
            {battle.status === "active" && battle.expiresAt && (
              <div className="text-orange-600 font-mono text-sm">
                <CountdownTimer expiresAt={battle.expiresAt} />
              </div>
            )}
          </div>
          <h3 className="mobile-title font-bold text-foreground mb-1">
            {battle.title}
          </h3>
          {battle.description && (
            <p className="mobile-text text-muted-foreground">
              {battle.description}
            </p>
          )}
        </div>
        {battle.status === "closed" && (
          <Trophy className="w-6 h-6 text-accent flex-shrink-0" />
        )}
      </div>

      {/* Battle Info */}
      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{battle.participants?.length || 0} participantes</span>
        </div>
        {battle.totalVotes !== undefined && (
          <div className="flex items-center gap-1">
            <span>{battle.totalVotes} votos</span>
          </div>
        )}
        {battle.durationMinutes && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{battle.durationMinutes}min</span>
          </div>
        )}
      </div>

      {/* Participants Preview */}
      {showParticipants && battle.participants && battle.participants.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {battle.participants.slice(0, 3).map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: participant.color }}
                >
                  {participant.name.charAt(0)}
                </div>
                <span className="font-medium">{participant.name}</span>
              </div>
            ))}
            {battle.participants.length > 3 && (
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                +{battle.participants.length - 3} más
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      {getActionButton()}
    </div>
  );
}

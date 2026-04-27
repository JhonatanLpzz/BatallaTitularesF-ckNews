import { useState } from "react";
import { Participant } from "../types";
import { Check, Crown, Zap } from "lucide-react";

interface VoteOptionProps {
  participant: Participant;
  battleStatus: "draft" | "active" | "closed" | "tied" | "tiebreaker";
  isSelected?: boolean;
  hasVoted?: boolean;
  onVote: (participantId: number) => void;
  showResults?: boolean;
  maxVotes?: number;
  isInTie?: boolean;
  tiebreakRound?: number;
  disabled?: boolean;
}

export function VoteOption({
  participant,
  battleStatus,
  isSelected = false,
  hasVoted = false,
  onVote,
  showResults = false,
  maxVotes = 0,
  isInTie = false,
  tiebreakRound,
  disabled = false
}: VoteOptionProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (disabled || hasVoted || (battleStatus !== "active" && battleStatus !== "tiebreaker")) {
      return;
    }

    setIsVoting(true);
    try {
      await onVote(participant.id);
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const getProgressWidth = () => {
    if (!showResults || maxVotes === 0) return "0%";
    return `${(participant.votes / maxVotes) * 100}%`;
  };

  const getVoteButtonClass = () => {
    const baseClass = "w-full transition-all duration-300 font-semibold rounded-lg px-6 py-4 min-h-[56px] flex items-center justify-center gap-2";
    
    if (disabled || (hasVoted && !isSelected)) {
      return `${baseClass} bg-muted text-muted-foreground/50 cursor-not-allowed`;
    }

    if (isSelected && hasVoted) {
      return `${baseClass} bg-status-success/20 border-2 border-status-success/30 text-status-success`;
    }

    if (battleStatus === "tiebreaker" && isInTie) {
      return `${baseClass} fn-button-accent hover:scale-[1.02] shadow-lg`;
    }

    return `${baseClass} fn-button-primary hover:scale-[1.02] shadow-lg`;
  };

  const getButtonText = () => {
    if (isVoting) return "Votando...";
    if (hasVoted && isSelected) return "¡Tu Voto!";
    if (hasVoted) return "Votado";
    if (battleStatus === "tiebreaker") return "🔥 Voto Desempate";
    return "Votar";
  };

  const getCardClass = () => {
    let baseClass = "fn-card p-6 transition-all duration-300";
    
    if (isInTie && battleStatus === "tied") {
      baseClass += " border-2 border-status-warning/40 bg-status-warning/5";
    } else if (isInTie && battleStatus === "tiebreaker") {
      baseClass += " border-2 border-status-warning/50 bg-status-warning/5 shadow-lg";
    } else if (isSelected && hasVoted) {
      baseClass += " border-2 border-status-success/30 bg-status-success/5";
    } else if (showResults && participant.votes === maxVotes && maxVotes > 0) {
      baseClass += " border-2 border-accent bg-accent/10 shadow-lg";
    }
    
    if (!disabled && !hasVoted && (battleStatus === "active" || battleStatus === "tiebreaker")) {
      baseClass += " hover:scale-[1.02] hover:shadow-lg cursor-pointer";
    }

    return baseClass;
  };

  return (
    <div className={getCardClass()} onClick={handleVote}>
      {/* Participant Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: participant.color }}
        >
          {participant.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-foreground">
            {participant.name}
          </h3>
          {isInTie && battleStatus === "tied" && (
            <div className="flex items-center gap-1 text-status-warning text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>¡EMPATE!</span>
            </div>
          )}
          {isInTie && battleStatus === "tiebreaker" && (
            <div className="flex items-center gap-1 text-status-warning text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>Desempate Ronda {tiebreakRound || 1}</span>
            </div>
          )}
          {showResults && participant.votes === maxVotes && maxVotes > 0 && (
            <div className="flex items-center gap-1 text-accent text-sm font-medium">
              <Crown className="w-4 h-4" />
              <span>¡GANADOR!</span>
            </div>
          )}
        </div>
      </div>

      {/* Headline */}
      <div className="mb-6">
        <p className="text-foreground text-lg leading-relaxed font-medium">
          "{participant.headline}"
        </p>
      </div>

      {/* Results Bar */}
      {showResults && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Votos: {participant.votes}</span>
            <span className="text-sm font-semibold text-foreground">{participant.percentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out rounded-full"
              style={{ width: getProgressWidth() }}
            />
          </div>
        </div>
      )}

      {/* Vote Button */}
      {(battleStatus === "active" || battleStatus === "tiebreaker") && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleVote();
          }}
          disabled={disabled || isVoting || (hasVoted && battleStatus !== "tiebreaker")}
          className={getVoteButtonClass()}
        >
          {isVoting && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />}
          {hasVoted && isSelected && !isVoting && <Check className="w-5 h-5" />}
          <span>{getButtonText()}</span>
        </button>
      )}

      {/* Tie Status Message */}
      {battleStatus === "tied" && isInTie && (
        <div className="mt-4 p-3 bg-status-warning/20 border border-status-warning/40 rounded-lg">
          <p className="text-status-warning text-sm font-medium text-center">
            🤝 ¡Empate detectado! Esperando desempate...
          </p>
        </div>
      )}

      {/* Final Result */}
      {battleStatus === "closed" && showResults && (
        <div className="mt-4 text-center">
          {participant.votes === maxVotes && maxVotes > 0 ? (
            <div className="p-3 bg-accent/10 border border-accent rounded-lg">
              <p className="text-accent font-bold">
                👑 ¡CAMPEÓN DE LA BATALLA!
              </p>
            </div>
          ) : (
            <div className="p-2 bg-muted rounded-lg">
              <p className="text-muted-foreground text-sm">
                Batalla finalizada
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

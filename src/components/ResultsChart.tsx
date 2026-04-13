import { useEffect, useState } from "react";
import { Crown, TrendingUp, Users, Zap } from "lucide-react";
import { Participant } from "../types";

interface ResultsChartProps {
  participants: Participant[];
  totalVotes: number;
  battleStatus: "draft" | "active" | "closed" | "tied" | "tiebreaker";
  showAnimation?: boolean;
  maxHeight?: number;
}

export function ResultsChart({ 
  participants, 
  totalVotes, 
  battleStatus,
  showAnimation = true,
  maxHeight = 300 
}: ResultsChartProps) {
  const [animatedVotes, setAnimatedVotes] = useState<Record<number, number>>({});

  // Animate vote counts
  useEffect(() => {
    if (!showAnimation) {
      const initialVotes = participants.reduce((acc, p) => ({ ...acc, [p.id]: p.votes }), {});
      setAnimatedVotes(initialVotes);
      return;
    }

    const animationDuration = 1500;
    const steps = 30;
    const stepDuration = animationDuration / steps;

    participants.forEach((participant) => {
      const targetVotes = participant.votes;
      const startVotes = animatedVotes[participant.id] || 0;
      const voteDiff = targetVotes - startVotes;

      if (voteDiff === 0) return;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentVotes = Math.round(startVotes + voteDiff * easeOutCubic);

        setAnimatedVotes(prev => ({ ...prev, [participant.id]: currentVotes }));

        if (currentStep >= steps) {
          clearInterval(interval);
          setAnimatedVotes(prev => ({ ...prev, [participant.id]: targetVotes }));
        }
      }, stepDuration);
    });
  }, [participants, showAnimation]);

  const sortedParticipants = [...participants].sort((a, b) => b.votes - a.votes);
  const maxVotes = Math.max(...participants.map(p => p.votes), 1);
  const tiedParticipants = sortedParticipants.filter(p => p.votes === maxVotes && maxVotes > 0);
  const hasTie = tiedParticipants.length > 1;

  const getBarHeight = (votes: number) => {
    if (maxVotes === 0) return 0;
    return (votes / maxVotes) * maxHeight;
  };

  const getParticipantStatus = (participant: Participant) => {
    if (battleStatus === "closed" && participant.votes === maxVotes && maxVotes > 0) {
      return hasTie ? "tied-winner" : "winner";
    }
    if (hasTie && tiedParticipants.some(p => p.id === participant.id)) {
      return "tied";
    }
    return "normal";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "winner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "tied-winner":
      case "tied":
        return <Zap className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case "winner":
        return {
          bar: "from-yellow-400 to-yellow-600",
          glow: "shadow-yellow-500/30",
          text: "text-yellow-600"
        };
      case "tied-winner":
      case "tied":
        return {
          bar: "from-orange-400 to-orange-600", 
          glow: "shadow-orange-500/30",
          text: "text-orange-600"
        };
      default:
        return {
          bar: "from-primary to-primary/80",
          glow: "shadow-primary/20",
          text: "text-primary"
        };
    }
  };

  if (participants.length === 0) {
    return (
      <div className="fn-card p-8 text-center">
        <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">No hay participantes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Resultados en Tiempo Real</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Total de votos: <span className="font-bold text-foreground">{totalVotes}</span>
        </p>
        
        {/* Tie Status */}
        {hasTie && (
          <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              <span className="text-orange-800 font-medium">
                ¡Empate detectado entre {tiedParticipants.length} participantes!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Results Chart */}
      <div className="fn-card p-6">
        <div className="space-y-4">
          {sortedParticipants.map((participant, index) => {
            const currentVotes = animatedVotes[participant.id] || 0;
            const barHeight = getBarHeight(currentVotes);
            const status = getParticipantStatus(participant);
            const colors = getStatusColors(status);
            const percentage = totalVotes > 0 ? Math.round((currentVotes / totalVotes) * 100) : 0;

            return (
              <div key={participant.id} className="relative">
                {/* Participant Info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: participant.color }}
                      />
                      <span className="font-semibold text-foreground">
                        {participant.name}
                      </span>
                      {getStatusIcon(status)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {currentVotes} votos
                    </span>
                    <span className={`text-xl font-bold ${colors.text}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors.bar} transition-all duration-1000 ease-out rounded-full ${colors.glow} shadow-lg`}
                      style={{ 
                        width: `${percentage}%`,
                        minWidth: currentVotes > 0 ? "8px" : "0px"
                      }}
                    />
                  </div>
                  
                  {/* Vote Count Inside Bar */}
                  {percentage > 15 && (
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <span className="text-white text-sm font-bold">
                        {currentVotes}
                      </span>
                    </div>
                  )}
                </div>

                {/* Headline Preview */}
                <div className="mt-2 text-sm text-muted-foreground italic truncate">
                  "{participant.headline}"
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart Stats */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                <strong>{participants.length}</strong> participantes
              </span>
              <span className="text-muted-foreground">
                <strong>{totalVotes}</strong> votos totales
              </span>
            </div>
            
            {battleStatus === "active" && (
              <div className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">En vivo</span>
              </div>
            )}
            
            {battleStatus === "tiebreaker" && (
              <div className="flex items-center gap-1 text-orange-600">
                <Zap className="w-4 h-4" />
                <span className="font-medium">Desempate activo</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for real-time results updates
export function useResultsChart(participants: Participant[]) {
  const [previousVotes, setPreviousVotes] = useState<Record<number, number>>({});
  const [newVotes, setNewVotes] = useState<number[]>([]);

  useEffect(() => {
    const currentVotes = participants.reduce((acc, p) => ({ ...acc, [p.id]: p.votes }), {});
    
    // Detect new votes
    const newVoteParticipants: number[] = [];
    participants.forEach(participant => {
      const prevVotes = previousVotes[participant.id] || 0;
      if (participant.votes > prevVotes) {
        newVoteParticipants.push(participant.id);
      }
    });

    if (newVoteParticipants.length > 0) {
      setNewVotes(newVoteParticipants);
      // Clear new vote indicators after animation
      setTimeout(() => setNewVotes([]), 2000);
    }

    setPreviousVotes(currentVotes);
  }, [participants, previousVotes]);

  return { newVotes };
}

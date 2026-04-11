import { useState, useEffect } from "react";
import { AlertTriangle, Crown, Zap } from "lucide-react";
import { Battle, Participant } from "../types";
import { VoteOption } from "./VoteOption";
import { CountdownTimer } from "./CountdownTimer";
import { detectTie, getTieSummary, isParticipantInTie } from "../utils/battleUtils";

interface TieManagerProps {
  battle: Battle;
  onVote: (participantId: number) => Promise<void>;
  userVote?: { participantId: number; timestamp: string } | null;
  showLogo?: boolean;
}

export function TieManager({ battle, onVote, userVote, showLogo = true }: TieManagerProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [tieDetection, setTieDetection] = useState(detectTie(battle.participants || []));

  useEffect(() => {
    if (battle.participants) {
      setTieDetection(detectTie(battle.participants));
    }
  }, [battle.participants]);

  const handleVote = async (participantId: number) => {
    setIsVoting(true);
    try {
      await onVote(participantId);
    } catch (error) {
      console.error("Error voting in tiebreaker:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const getTiebreakHeader = () => {
    if (battle.status === "tied") {
      return {
        title: "🤝 ¡EMPATE DETECTADO!",
        subtitle: "Se ha detectado un empate. Preparando desempate...",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-400"
      };
    } else if (battle.status === "tiebreaker") {
      return {
        title: `🔥 DESEMPATE - RONDA ${battle.tiebreakRound || 1}`,
        subtitle: getTieSummary(battle),
        bgColor: "bg-orange-100",
        textColor: "text-orange-800", 
        borderColor: "border-orange-500"
      };
    }
    return null;
  };

  const headerInfo = getTiebreakHeader();
  if (!headerInfo) return null;

  const tiedParticipants = battle.participants?.filter(p => 
    isParticipantInTie(p.id, battle)
  ) || [];

  const eliminatedParticipants = battle.participants?.filter(p => 
    !isParticipantInTie(p.id, battle)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Logo Header */}
      {showLogo && (
        <div className="text-center">
          <img 
            src="/logo_fn.png" 
            alt="F*cks News" 
            className="h-16 mx-auto mb-4"
          />
        </div>
      )}

      {/* Tie Status Header */}
      <div className={`${headerInfo.bgColor} ${headerInfo.borderColor} border-2 rounded-xl p-6`}>
        <div className="text-center">
          <h1 className={`text-2xl md:text-3xl font-bold ${headerInfo.textColor} mb-2`}>
            {headerInfo.title}
          </h1>
          <p className={`${headerInfo.textColor} text-lg mb-4`}>
            {headerInfo.subtitle}
          </p>
          
          {battle.status === "tiebreaker" && battle.expiresAt && (
            <div className="flex justify-center">
              <CountdownTimer 
                expiresAt={battle.expiresAt} 
                size="lg"
              />
            </div>
          )}
        </div>

        {/* Battle Info */}
        <div className="mt-4 pt-4 border-t border-current/20">
          <div className="flex justify-center items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>{tiedParticipants.length} participantes en empate</span>
            </div>
            {battle.totalVotes !== undefined && (
              <div className="flex items-center gap-1">
                <span>📊 {battle.totalVotes} votos totales</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {battle.status === "tiebreaker" && (
        <div className="fn-card p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Instrucciones del Desempate</h3>
              <p className="text-sm text-muted-foreground">
                Solo los participantes empatados pueden recibir votos. 
                Elige tu favorito para romper el empate. El tiempo es limitado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Participants in Tiebreaker */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center">
          {battle.status === "tied" ? "Participantes Empatados" : "¡Vota para Desempatar!"}
        </h2>
        
        {tiedParticipants.map((participant) => (
          <VoteOption
            key={participant.id}
            participant={participant}
            battleStatus={battle.status}
            isSelected={userVote?.participantId === participant.id}
            hasVoted={userVote !== null}
            onVote={handleVote}
            showResults={battle.status === "closed"}
            maxVotes={Math.max(...tiedParticipants.map(p => p.votes))}
            isInTie={true}
            tiebreakRound={battle.tiebreakRound}
            disabled={isVoting || battle.status === "tied"}
          />
        ))}
      </div>

      {/* Eliminated Participants (if any) */}
      {eliminatedParticipants.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground text-center">
            Participantes Eliminados
          </h3>
          
          <div className="space-y-3 opacity-60">
            {eliminatedParticipants.map((participant) => (
              <div key={participant.id} className="fn-card p-4 grayscale">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: participant.color }}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{participant.name}</h4>
                    <p className="text-sm text-muted-foreground">"{participant.headline}"</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {participant.votes} votos
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voting Status */}
      {userVote && battle.status === "tiebreaker" && (
        <div className="fn-card p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-green-800">¡Voto registrado!</p>
              <p className="text-sm text-green-600">
                Has votado en el desempate. Esperando resultados...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Final Results */}
      {battle.status === "closed" && battle.winner && (
        <div className="fn-card p-6 bg-gradient-to-r from-accent/10 to-primary/10 border-accent">
          <div className="text-center">
            <Crown className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-accent mb-2">
              🏆 ¡GANADOR DEL DESEMPATE!
            </h2>
            <p className="text-lg font-semibold text-foreground mb-2">
              {battle.winner.name}
            </p>
            <p className="text-muted-foreground italic">
              "{battle.winner.headline}"
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              Votos finales: {battle.winner.votes} ({battle.winner.percentage}%)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

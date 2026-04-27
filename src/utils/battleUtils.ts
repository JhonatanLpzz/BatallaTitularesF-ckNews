import { Battle, Participant } from "../types";

export interface TieDetectionResult {
  hasTie: boolean;
  tiedParticipants: Participant[];
  winner: Participant | null;
  maxVotes: number;
}

/**
 * Detecta empates en una batalla y devuelve información sobre el estado
 */
export function detectTie(participants: Participant[]): TieDetectionResult {
  if (!participants || participants.length === 0) {
    return {
      hasTie: false,
      tiedParticipants: [],
      winner: null,
      maxVotes: 0
    };
  }

  // Ordenar participantes por votos (descendente)
  const sorted = [...participants].sort((a, b) => b.votes - a.votes);
  const maxVotes = sorted[0].votes;

  // Encontrar todos los participantes con la mayor cantidad de votos
  const topParticipants = sorted.filter(p => p.votes === maxVotes);
  
  // Si hay más de un participante con el máximo de votos, hay empate
  const hasTie = topParticipants.length > 1 && maxVotes > 0;

  return {
    hasTie,
    tiedParticipants: hasTie ? topParticipants : [],
    winner: !hasTie && maxVotes > 0 ? topParticipants[0] : null,
    maxVotes
  };
}

/**
 * Determina si una batalla debe pasar a estado de empate
 */
export function shouldStartTiebreaker(battle: Battle): boolean {
  if (battle.status !== "closed" || !battle.participants) {
    return false;
  }

  const tieResult = detectTie(battle.participants);
  return tieResult.hasTie;
}

/**
 * Prepara los datos para iniciar un desempate
 */
export function prepareTiebreaker(battle: Battle): Partial<Battle> | null {
  if (!battle.participants) return null;

  const tieResult = detectTie(battle.participants);
  
  if (!tieResult.hasTie) return null;

  // Resetear votos solo para participantes empatados
  const updatedParticipants = battle.participants.map(p => {
    if (tieResult.tiedParticipants.some(tp => tp.id === p.id)) {
      return { ...p, votes: 0, percentage: 0 };
    }
    return p;
  });

  return {
    status: "tiebreaker" as const,
    participants: updatedParticipants,
    tiedParticipants: tieResult.tiedParticipants.map(p => p.id),
    tiebreakRound: (battle.tiebreakRound || 0) + 1,
    totalVotes: 0,
    // Extender tiempo para el desempate (5 minutos adicionales)
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  };
}

/**
 * Verifica si un participante está en el empate actual
 */
export function isParticipantInTie(participantId: number, battle: Battle): boolean {
  if (!battle.tiedParticipants) return false;
  return battle.tiedParticipants.includes(participantId);
}

/**
 * Calcula porcentajes de votos para los participantes
 */
export function calculatePercentages(participants: Participant[], totalVotes: number): Participant[] {
  if (totalVotes === 0) {
    return participants.map(p => ({ ...p, percentage: 0 }));
  }

  return participants.map(p => ({
    ...p,
    percentage: Math.round((p.votes / totalVotes) * 100)
  }));
}

/**
 * Obtiene el mensaje apropiado para el estado de la batalla
 */
export function getBattleStatusMessage(battle: Battle): string {
  switch (battle.status) {
    case "draft":
      return "Batalla en preparación";
    case "active":
      return "¡Batalla en vivo! Vota ahora";
    case "tied":
      return "¡Empate detectado! Preparando desempate...";
    case "tiebreaker":
      return `🔥 Desempate - Ronda ${battle.tiebreakRound || 1}`;
    case "closed":
      return battle.winner ? 
        `🏆 Ganador: ${battle.winner.name}` : 
        "Batalla finalizada";
    default:
      return "Estado desconocido";
  }
}

/**
 * Determina si se pueden realizar votos en el estado actual
 */
export function canVote(battle: Battle): boolean {
  return battle.status === "active" || battle.status === "tiebreaker";
}

/**
 * Obtiene los colores apropiados para el estado de la batalla
 */
export function getBattleStatusColors(battle: Battle) {
  switch (battle.status) {
    case "draft":
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border"
      };
    case "active":
      return {
        bg: "bg-status-success/20",
        text: "text-status-success",
        border: "border-status-success/30"
      };
    case "tied":
      return {
        bg: "bg-status-warning/20",
        text: "text-status-warning",
        border: "border-status-warning/30"
      };
    case "tiebreaker":
      return {
        bg: "bg-status-warning/20",
        text: "text-status-warning",
        border: "border-status-warning/30"
      };
    case "closed":
      return {
        bg: "bg-destructive/20",
        text: "text-destructive",
        border: "border-destructive/30"
      };
    default:
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border"
      };
  }
}

/**
 * Valida que una batalla esté lista para empezar un desempate
 */
export function validateTiebreaker(battle: Battle): { isValid: boolean; error?: string } {
  if (!battle.participants || battle.participants.length < 2) {
    return { isValid: false, error: "Se necesitan al menos 2 participantes" };
  }

  if (!battle.tiedParticipants || battle.tiedParticipants.length < 2) {
    return { isValid: false, error: "Se necesitan al menos 2 participantes empatados" };
  }

  if (battle.status !== "tiebreaker") {
    return { isValid: false, error: "La batalla debe estar en estado de desempate" };
  }

  return { isValid: true };
}

/**
 * Crea un resumen del empate para mostrar al usuario
 */
export function getTieSummary(battle: Battle): string {
  if (!battle.tiedParticipants || !battle.participants) {
    return "";
  }

  const tiedNames = battle.participants
    .filter(p => battle.tiedParticipants!.includes(p.id))
    .map(p => p.name)
    .join(", ");

  const round = battle.tiebreakRound || 1;
  
  return `Empate entre: ${tiedNames} (Ronda ${round})`;
}

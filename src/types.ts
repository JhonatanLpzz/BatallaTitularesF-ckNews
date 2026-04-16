/**
 * @fileoverview Interfaces TypeScript compartidas entre frontend y servicios.
 * Define las formas de datos para batallas, participantes, votos, usuarios
 * y payloads de las llamadas API.
 * @module types
 */

import type { BattleStatusType } from "@/constants";

// ---------------------------------------------------------------------------
// Entidades del dominio
// ---------------------------------------------------------------------------

/**
 * Participante de una batalla con métricas de votación calculadas.
 * Los campos `votes` y `percentage` son enriquecidos por el backend
 * al consultar la batalla pública.
 */
export interface Participant {
  /** ID autoincremental único. */
  id: number;
  /** ID de la batalla a la que pertenece. */
  battleId: number;
  /** Nombre del participante (ej: "Camilo Pardo 'El Mago'"). */
  name: string;
  /** Titular/noticia con el que compite. */
  headline: string;
  /** URL del avatar (opcional). */
  avatarUrl: string | null;
  /** Color hexadecimal asignado al participante. */
  color: string;
  /** Posición de ordenamiento (0-based). */
  position: number;
  /** Cantidad de votos recibidos (calculado por el backend). */
  votes: number;
  /** Porcentaje de votos sobre el total (0–100, redondeado). */
  percentage: number;
}

/**
 * Batalla/competencia completa con metadatos, timer y participantes.
 * La forma varía según el endpoint: la lista admin no incluye `participants`,
 * mientras que el detalle público sí.
 */
export interface Battle {
  /** ID autoincremental único. */
  id: number;
  /** Código corto único para URLs públicas y QR (nanoid de 8 chars). */
  code: string;
  /** Título de la batalla. */
  title: string;
  /** Descripción opcional. */
  description: string | null;
  /** Estado actual de la batalla. */
  status: BattleStatusType;
  /** Duración configurada en minutos (`null` = sin límite). */
  durationMinutes: number | null;
  /** Timestamp ISO de activación (`null` si aún es borrador). */
  activatedAt: string | null;
  /** Timestamp ISO de expiración calculado (derivado de activatedAt + duration). */
  expiresAt?: string | null;
  /** Timestamp ISO de creación. */
  createdAt: string;
  /** Lista de participantes con votos (presente en detalle público). */
  participants?: Participant[];
  /** Total de votos emitidos en la batalla. */
  totalVotes?: number;
  /** IDs de participantes empatados (cuando `status === 'tied'`). */
  tiedParticipantIds?: number[];
  /** Número de ronda de desempate actual. */
  tiebreakRound?: number;
  /** ID del participante ganador (cuando la batalla se cierra con ganador claro). */
  winnerId?: number;
}

/**
 * Usuario administrador del sistema.
 * No incluye el hash de contraseña por seguridad.
 */
export interface AdminUser {
  /** ID autoincremental único. */
  id: number;
  /** Nombre de usuario (único en el sistema). */
  username: string;
  /** Timestamp ISO de creación de la cuenta. */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// SSE Events
// ---------------------------------------------------------------------------

/**
 * Evento SSE de actualización de votos.
 * Emitido cada vez que se registra o cambia un voto en una batalla activa.
 */
export interface VoteUpdate {
  /** Discriminador de tipo de evento. */
  type: "vote_update";
  /** Participantes con métricas actualizadas. */
  participants: Participant[];
  /** Total acumulado de votos. */
  totalVotes: number;
}

/** Evento SSE de conexión exitosa. */
export interface SSEConnectedEvent {
  /** Discriminador de tipo de evento. */
  type: "connected";
  /** ID único del cliente SSE asignado por el servidor. */
  clientId: string;
}

/** Unión de todos los eventos SSE posibles. */
export type SSEEvent = VoteUpdate | SSEConnectedEvent;

// ---------------------------------------------------------------------------
// API Payloads (Request)
// ---------------------------------------------------------------------------

/** Input para un participante al crear una batalla. */
export interface ParticipantInput {
  /** Nombre del participante. */
  name: string;
  /** Titular/noticia. */
  headline: string;
  /** Color hexadecimal (ej: "#dc2626"). */
  color: string;
}

/** Payload para crear una nueva batalla. */
export interface CreateBattlePayload {
  /** Título de la batalla. */
  title: string;
  /** Descripción opcional. */
  description?: string;
  /** Duración en minutos (`undefined` = sin límite de tiempo). */
  durationMinutes?: number;
  /** Lista de participantes (mínimo 2). */
  participants: ParticipantInput[];
}

/** Payload para registrar un voto nuevo. */
export interface CastVotePayload {
  /** Código de la batalla. */
  battleCode: string;
  /** ID del participante elegido. */
  participantId: number;
  /** Fingerprint único del dispositivo del votante. */
  fingerprint: string;
  /** Nombre completo del votante (obligatorio). */
  voterName: string;
  /** Documento de identidad (opcional). */
  voterDocument?: string;
  /** Número de celular (opcional). */
  voterPhone?: string;
}

/** Payload para cambiar un voto existente. */
export interface ChangeVotePayload {
  /** Código de la batalla. */
  battleCode: string;
  /** ID del nuevo participante elegido. */
  participantId: number;
  /** Fingerprint del dispositivo (debe coincidir con el voto original). */
  fingerprint: string;
}

// ---------------------------------------------------------------------------
// API Responses
// ---------------------------------------------------------------------------

/** Respuesta de verificación de voto previo. */
export interface VoteCheckResponse {
  /** `true` si el dispositivo ya emitió un voto en esta batalla. */
  hasVoted: boolean;
  /** ID del participante por el que votó (`null` si no ha votado). */
  participantId: number | null;
}

/** Respuesta de generación de código QR. */
export interface QRResponse {
  /** Data URL del QR en formato PNG base64. */
  qr: string;
  /** URL pública de votación codificada en el QR. */
  url: string;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

/** Error estandarizado de las llamadas API. */
export interface ApiError {
  /** Código HTTP de estado (ej: 401, 404, 409). */
  status: number;
  /** Mensaje de error legible. */
  message: string;
}

/**
 * @fileoverview Constantes centralizadas de la aplicación Batalla de Titulares.
 * Contiene configuraciones de API, colores, valores por defecto y rutas.
 * @module constants
 */

// ---------------------------------------------------------------------------
// API Endpoints
// ---------------------------------------------------------------------------

/** Prefijo base para todos los endpoints de la API REST. */
export const API_BASE = "/api";

/** Endpoints de autenticación y gestión de sesiones. */
export const API_AUTH = {
  LOGIN: `${API_BASE}/auth/login`,
  LOGOUT: `${API_BASE}/auth/logout`,
  ME: `${API_BASE}/auth/me`,
  NEEDS_SETUP: `${API_BASE}/auth/needs-setup`,
  SETUP: `${API_BASE}/auth/setup`,
} as const;

/** Endpoints de batallas (admin y público). */
export const API_BATTLES = {
  LIST: `${API_BASE}/battles`,
  BY_CODE: (code: string) => `${API_BASE}/battles/${code}`,
  CREATE: `${API_BASE}/battles`,
  STATUS: (id: number) => `${API_BASE}/battles/${id}/status`,
  DELETE: (id: number) => `${API_BASE}/battles/${id}`,
  RESET_VOTES: (id: number) => `${API_BASE}/battles/${id}/votes`,
  QR: (code: string, base: string) =>
    `${API_BASE}/battles/${code}/qr?base=${encodeURIComponent(base)}`,
  TIEBREAKER: (id: number) => `${API_BASE}/battles/${id}/tiebreaker`,
} as const;

/** Endpoint para Server-Sent Events (actualizaciones en tiempo real). */
export const SSE_ENDPOINT = (code: string) => `${API_BASE}/battles/${code}/stream`;

/** Endpoints de votación pública. */
export const API_VOTES = {
  CAST: `${API_BASE}/votes`,
  CHANGE: `${API_BASE}/votes`,
  CHECK: (code: string, fp: string) =>
    `${API_BASE}/votes/check/${code}?fp=${fp}`,
} as const;

/** Endpoints de gestión de usuarios administradores. */
export const API_USERS = {
  LIST: `${API_BASE}/users`,
  CREATE: `${API_BASE}/users`,
  UPDATE_USERNAME: (id: number) => `${API_BASE}/users/${id}/username`,
  UPDATE_PASSWORD: (id: number) => `${API_BASE}/users/${id}/password`,
  DELETE: (id: number) => `${API_BASE}/users/${id}`,
} as const;

/** Endpoints de rankings globales. */
export const API_RANKINGS = {
  GLOBAL: `${API_BASE}/rankings/global`,
} as const;

/** Path base de Socket.IO para actualizaciones en tiempo real. */
export const WS_PATH = "/ws/socket.io";

// ---------------------------------------------------------------------------
// Rutas del Frontend
// ---------------------------------------------------------------------------

/** Rutas de navegación de la SPA. */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/usuarios",
  RANKINGS: "/ranking",
  VOTE: (code: string) => `/votar/${code}`,
  RESULTS: (code: string) => `/resultados/${code}`,
} as const;

// ---------------------------------------------------------------------------
// Valores por defecto
// ---------------------------------------------------------------------------

/** Paleta de colores disponible para participantes. */
export const DEFAULT_PARTICIPANT_COLORS = [
  "#1a56a8",
  "#dc2626",
  "#10b981",
  "#f59e0b",
  "#7c3aed",
  "#0891b2",
] as const;

/** Participantes predeterminados al crear una batalla nueva. */
export const DEFAULT_PARTICIPANTS = [
  { name: "Camilo Pardo 'El Mago'", headline: "Titulares en vivo...", color: DEFAULT_PARTICIPANT_COLORS[1] },
  { name: "Camilo Sanchez 'El Inquieto'", headline: "Titulares en vivo...", color: DEFAULT_PARTICIPANT_COLORS[0] },
] as const;

/** Número mínimo de participantes por batalla. */
export const MIN_PARTICIPANTS = 2;

/** Número máximo de participantes por batalla. */
export const MAX_PARTICIPANTS = 6;

/** Duración por defecto para rondas de desempate (en minutos). */
export const DEFAULT_TIEBREAKER_DURATION = 5;

// ---------------------------------------------------------------------------
// Storage Keys
// ---------------------------------------------------------------------------

/** Clave de localStorage para el token de sesión admin. */
export const STORAGE_KEY_TOKEN = "batalla-admin-token";

/** Clave de localStorage para el fingerprint del votante. */
export const STORAGE_KEY_FINGERPRINT = "batalla-fp";

/** Clave de localStorage para la preferencia de tema. */
export const STORAGE_KEY_THEME = "fcknews-theme";

// ---------------------------------------------------------------------------
// Realtime & Timers
// ---------------------------------------------------------------------------

/** Intervalo de reconexión WebSocket en milisegundos. */
export const WS_RECONNECT_INTERVAL_MS = 3000;

/** Intervalo de reconexión SSE en milisegundos. */
export const SSE_RECONNECT_INTERVAL_MS = 3000;

/** Intervalo de actualización del countdown en milisegundos. */
export const COUNTDOWN_INTERVAL_MS = 1000;

/** Delay antes de redirigir cuando expira el timer (ms). */
export const TIMER_REDIRECT_DELAY_MS = 1000;

// ---------------------------------------------------------------------------
// Estados de Batalla
// ---------------------------------------------------------------------------

/** Estados posibles de una batalla. */
export const BATTLE_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  CLOSED: "closed",
  TIED: "tied",
  TIEBREAKER: "tiebreaker",
} as const;

/** Tipo unión derivado de los estados de batalla. */
export type BattleStatusType = (typeof BATTLE_STATUS)[keyof typeof BATTLE_STATUS];

/** Estados que se consideran "en vivo" (con votación activa). */
export const LIVE_STATUSES: BattleStatusType[] = [
  BATTLE_STATUS.ACTIVE,
  BATTLE_STATUS.TIEBREAKER,
];

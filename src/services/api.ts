/**
 * @fileoverview Capa de servicios API centralizada para Batalla de Titulares.
 * Todas las llamadas HTTP al backend se canalizan por aquí, garantizando
 * tipado fuerte, manejo de errores consistente y headers de autenticación.
 * @module services/api
 */

import {
  API_AUTH,
  API_BATTLES,
  API_VOTES,
  API_USERS,
} from "@/constants";
import type {
  Battle,
  Participant,
  AdminUser,
  CreateBattlePayload,
  CastVotePayload,
  ChangeVotePayload,
  VoteCheckResponse,
  QRResponse,
  ApiError,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Construye los headers de autorización Bearer para peticiones protegidas.
 * @param token - Token JWT de sesión del administrador.
 * @returns Objeto `Headers` con Authorization y Content-Type.
 */
function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Wrapper genérico para peticiones fetch con manejo de errores estandarizado.
 * @template T - Tipo esperado del body de respuesta.
 * @param url - URL del endpoint.
 * @param options - Opciones de `fetch`.
 * @returns Promesa con los datos parseados.
 * @throws {ApiError} Si la respuesta no es ok.
 */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);

  if (!res.ok) {
    let errorBody: { error?: string } = {};
    try {
      errorBody = await res.json();
    } catch {
      // respuesta no-JSON
    }
    const err: ApiError = {
      status: res.status,
      message: errorBody.error || res.statusText,
    };
    throw err;
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------------------

/** Servicio de autenticación y gestión de sesiones. */
export const authService = {
  /**
   * Inicia sesión con credenciales de administrador.
   * @param username - Nombre de usuario.
   * @param password - Contraseña.
   * @returns Token de sesión, nombre de usuario y fecha de expiración.
   */
  login(username: string, password: string) {
    return request<{ token: string; username: string; expiresAt: string }>(
      API_AUTH.LOGIN,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
    );
  },

  /**
   * Cierra la sesión actual e invalida el token.
   * @param token - Token de sesión a invalidar.
   */
  logout(token: string) {
    return request<{ success: boolean }>(API_AUTH.LOGOUT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /**
   * Verifica la sesión actual y retorna datos del usuario autenticado.
   * @param token - Token de sesión.
   * @returns Nombre de usuario asociado al token.
   */
  me(token: string) {
    return request<{ username: string }>(API_AUTH.ME, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /**
   * Verifica si el sistema necesita configuración inicial (sin admins).
   * @returns `true` si se necesita crear el primer administrador.
   */
  needsSetup() {
    return request<{ needsSetup: boolean }>(API_AUTH.NEEDS_SETUP);
  },

  /**
   * Crea el primer administrador del sistema (setup inicial).
   * @param username - Nombre de usuario.
   * @param password - Contraseña (mínimo 4 caracteres).
   */
  setup(username: string, password: string) {
    return request<{ success: boolean; message: string }>(API_AUTH.SETUP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  },
};

// ---------------------------------------------------------------------------
// Battle Service
// ---------------------------------------------------------------------------

/** Servicio de gestión de batallas. */
export const battleService = {
  /**
   * Lista todas las batallas (requiere autenticación admin).
   * @param token - Token de sesión admin.
   */
  list(token: string) {
    return request<Battle[]>(API_BATTLES.LIST, {
      headers: authHeaders(token),
    });
  },

  /**
   * Obtiene los detalles de una batalla por su código público.
   * Incluye participantes con conteo de votos y porcentajes.
   * @param code - Código único de la batalla.
   */
  getByCode(code: string) {
    return request<Battle>(API_BATTLES.BY_CODE(code));
  },

  /**
   * Crea una nueva batalla con participantes.
   * @param token - Token de sesión admin.
   * @param payload - Datos de la batalla a crear.
   */
  create(token: string, payload: CreateBattlePayload) {
    return request<Battle>(API_BATTLES.CREATE, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  /**
   * Actualiza el estado de una batalla (activar, cerrar, etc.).
   * @param token - Token de sesión admin.
   * @param id - ID numérico de la batalla.
   * @param status - Nuevo estado.
   */
  updateStatus(token: string, id: number, status: string) {
    return request<{ success: boolean }>(API_BATTLES.STATUS(id), {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Elimina una batalla y todos sus datos asociados.
   * @param token - Token de sesión admin.
   * @param id - ID numérico de la batalla.
   */
  delete(token: string, id: number) {
    return request<{ success: boolean }>(API_BATTLES.DELETE(id), {
      method: "DELETE",
      headers: authHeaders(token),
    });
  },

  /**
   * Reinicia todos los votos de una batalla.
   * @param token - Token de sesión admin.
   * @param id - ID numérico de la batalla.
   */
  resetVotes(token: string, id: number) {
    return request<{ success: boolean }>(API_BATTLES.RESET_VOTES(id), {
      method: "DELETE",
      headers: authHeaders(token),
    });
  },

  /**
   * Genera un código QR para la votación pública de una batalla.
   * @param code - Código de la batalla.
   * @param base - URL base del frontend (ej: `window.location.origin`).
   */
  getQR(code: string, base: string) {
    return request<QRResponse>(API_BATTLES.QR(code, base));
  },

  /**
   * Inicia una ronda de desempate para una batalla empatada.
   * @param token - Token de sesión admin.
   * @param id - ID numérico de la batalla.
   * @param durationMinutes - Duración de la ronda de desempate.
   */
  startTiebreaker(token: string, id: number, durationMinutes: number) {
    return request<{ success: boolean }>(API_BATTLES.TIEBREAKER(id), {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ durationMinutes }),
    });
  },
};

// ---------------------------------------------------------------------------
// Vote Service
// ---------------------------------------------------------------------------

/** Servicio de votación pública. */
export const voteService = {
  /**
   * Registra un voto nuevo para un participante.
   * @param payload - Datos del voto incluyendo nombre del votante.
   * @returns `{ success, message }` si el voto fue registrado.
   * @throws 409 si el votante ya registró un voto en esta batalla.
   */
  cast(payload: CastVotePayload) {
    return request<{ success: boolean; message: string }>(API_VOTES.CAST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Cambia un voto existente a otro participante.
   * @param payload - Datos del cambio de voto.
   */
  change(payload: ChangeVotePayload) {
    return request<{ success: boolean; message: string }>(API_VOTES.CHANGE, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Verifica si un dispositivo (fingerprint) ya votó en una batalla.
   * @param code - Código de la batalla.
   * @param fingerprint - Fingerprint del dispositivo.
   */
  check(code: string, fingerprint: string) {
    return request<VoteCheckResponse>(API_VOTES.CHECK(code, fingerprint));
  },
};

// ---------------------------------------------------------------------------
// User Service
// ---------------------------------------------------------------------------

/** Servicio de gestión de usuarios administradores. */
export const userService = {
  /**
   * Lista todos los administradores del sistema.
   * @param token - Token de sesión admin.
   */
  list(token: string) {
    return request<AdminUser[]>(API_USERS.LIST, {
      headers: authHeaders(token),
    });
  },

  /**
   * Crea un nuevo usuario administrador.
   * @param token - Token de sesión admin.
   * @param username - Nombre de usuario.
   * @param password - Contraseña (mínimo 4 caracteres).
   */
  create(token: string, username: string, password: string) {
    return request<AdminUser>(API_USERS.CREATE, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ username, password }),
    });
  },

  /**
   * Actualiza el nombre de usuario de un administrador.
   * @param token - Token de sesión admin.
   * @param id - ID del usuario.
   * @param username - Nuevo nombre de usuario.
   */
  updateUsername(token: string, id: number, username: string) {
    return request<{ success: boolean }>(API_USERS.UPDATE_USERNAME(id), {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ username }),
    });
  },

  /**
   * Actualiza la contraseña de un administrador.
   * @param token - Token de sesión admin.
   * @param id - ID del usuario.
   * @param password - Nueva contraseña (mínimo 4 caracteres).
   */
  updatePassword(token: string, id: number, password: string) {
    return request<{ success: boolean }>(API_USERS.UPDATE_PASSWORD(id), {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ password }),
    });
  },

  /**
   * Elimina un usuario administrador.
   * No se permite auto-eliminación ni eliminar el último admin.
   * @param token - Token de sesión admin.
   * @param id - ID del usuario a eliminar.
   */
  delete(token: string, id: number) {
    return request<{ success: boolean }>(API_USERS.DELETE(id), {
      method: "DELETE",
      headers: authHeaders(token),
    });
  },
};

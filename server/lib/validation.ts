/**
 * @fileoverview Utilidades de validación y sanitización server-side.
 *
 * Funciones compartidas entre rutas para:
 * - Parsear IDs numéricos de params con validación NaN
 * - Sanitizar strings de usuario contra XSS stored
 * - Calcular expiresAt de batallas (evita duplicación)
 *
 * @module server/lib/validation
 */

import type { FastifyReply } from "fastify";

/**
 * Parsea un parámetro de ruta como entero positivo.
 * Retorna `null` y envía 400 si el valor no es un entero válido.
 * Previene inyección de valores no numéricos en queries.
 *
 * @param raw - Valor crudo del parámetro (string).
 * @param reply - Reply de Fastify para enviar error.
 * @returns Entero positivo, o `null` si es inválido (ya envió respuesta).
 */
export function parseIdParam(raw: string, reply: FastifyReply): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    reply.status(400).send({ error: "ID inválido" });
    return null;
  }
  return id;
}

/**
 * Elimina tags HTML peligrosos y recorta whitespace de un string.
 * Previene XSS stored cuando los datos se renderizan en el frontend.
 *
 * @param input - String crudo del usuario.
 * @param maxLength - Longitud máxima permitida (default 500).
 * @returns String sanitizado.
 */
export function sanitizeText(input: string, maxLength = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Calcula el timestamp ISO de expiración de una batalla.
 * Función compartida para evitar duplicación entre rutas.
 *
 * @param activatedAt - Timestamp ISO de activación (nullable).
 * @param durationMinutes - Duración en minutos (nullable).
 * @returns Timestamp ISO de expiración, o `null` si no aplica.
 */
export function computeExpiresAt(
  activatedAt: string | null,
  durationMinutes: number | null,
): string | null {
  if (!activatedAt || !durationMinutes) return null;
  const exp = new Date(new Date(activatedAt).getTime() + durationMinutes * 60 * 1000);
  return exp.toISOString();
}

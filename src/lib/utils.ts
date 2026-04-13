/**
 * @fileoverview Funciones utilitarias compartidas del frontend.
 * @module lib/utils
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { STORAGE_KEY_FINGERPRINT } from "@/constants";

/**
 * Combina clases CSS con soporte para condicionales (clsx) y resolución
 * de conflictos de Tailwind (tailwind-merge).
 * @param inputs - Clases CSS, arrays u objetos condicionales.
 * @returns String de clases CSS combinadas sin duplicados.
 * @example
 * cn("px-4 py-2", isActive && "bg-primary", "px-6") // "py-2 bg-primary px-6"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Genera o recupera un fingerprint único por dispositivo/navegador.
 * Se almacena en `localStorage` para persistir entre sesiones y garantizar
 * un solo voto por dispositivo en cada batalla.
 * @returns Fingerprint alfanumérico persistente.
 */
export function generateFingerprint(): string {
  const stored = localStorage.getItem(STORAGE_KEY_FINGERPRINT);
  if (stored) return stored;

  const fp =
    Math.random().toString(36).substring(2) +
    Date.now().toString(36) +
    navigator.userAgent.length.toString(36);

  localStorage.setItem(STORAGE_KEY_FINGERPRINT, fp);
  return fp;
}

/**
 * Formatea un número grande en notación abreviada (K/M).
 * @param n - Número a formatear.
 * @returns Representación abreviada (ej: 1500 → "1.5K").
 */
export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

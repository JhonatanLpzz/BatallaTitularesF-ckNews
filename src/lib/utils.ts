import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateFingerprint(): string {
  const stored = localStorage.getItem("batalla-fp");
  if (stored) return stored;

  const fp =
    Math.random().toString(36).substring(2) +
    Date.now().toString(36) +
    navigator.userAgent.length.toString(36);

  localStorage.setItem("batalla-fp", fp);
  return fp;
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

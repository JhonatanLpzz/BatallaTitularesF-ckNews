/**
 * @fileoverview Componente de pantalla de carga reutilizable.
 * Se usa como fallback mientras se cargan datos de la API.
 * @module components/LoadingScreen
 */

import { Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LoadingScreenProps {
  /** Si `true`, ocupa toda la pantalla. Si `false`, se adapta al contenedor. @default true */
  fullScreen?: boolean;
  /** Mensaje opcional debajo del spinner. */
  message?: string;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Spinner de carga con animación y mensaje opcional.
 * Dos modos: fullscreen (para páginas completas) o inline (para secciones).
 *
 * @param props - {@link LoadingScreenProps}
 *
 * @example
 * // Pantalla completa
 * if (loading) return <LoadingScreen />;
 *
 * // Dentro de un contenedor
 * if (loading) return <LoadingScreen fullScreen={false} message="Cargando batallas..." />;
 */
export function LoadingScreen({ fullScreen = true, message }: LoadingScreenProps) {
  const containerClass = fullScreen
    ? "min-h-screen flex items-center justify-center bg-background"
    : "flex items-center justify-center py-20";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 border-t-2 border-primary/20 rounded-full animate-spin" />
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        {message && (
          <p className="text-sm text-muted-foreground font-medium animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
}

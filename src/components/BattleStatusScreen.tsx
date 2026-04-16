/**
 * @fileoverview Pantalla de estado de batalla (error, borrador, cerrada, empate).
 * Se muestra cuando la batalla no está en estado votable.
 * @module components/BattleStatusScreen
 */

import { Link } from "react-router-dom";
import { XCircle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import type { Battle } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BattleStatusScreenProps {
  /** Código de la batalla (para enlaces de resultados). */
  code: string;
  /** Objeto batalla (`null` si no se encontró). */
  battle: Battle | null;
  /** Mensaje de error (`null` si no hay error). */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Pantalla informativa que se muestra cuando una batalla no se puede votar:
 * - Error (batalla no encontrada)
 * - Borrador (aún no activada)
 * - Cerrada (votación terminada)
 * - Empate (batalla terminó en tablas)
 *
 * @param props - {@link BattleStatusScreenProps}
 */
export function BattleStatusScreen({ code, battle, error }: BattleStatusScreenProps) {
  const isClosed = battle?.status === "closed";
  const isTied = battle?.status === "tied";
  const isDraft = battle?.status === "draft";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[120px] rounded-full" />

      <div className="glass-card rounded-[40px] border border-white/5 bg-white/[0.02] p-10 text-center max-w-sm w-full z-10 backdrop-blur-3xl animate-in fade-in zoom-in duration-700">
        <img src="/logo_fn.png" alt="Logo" className="h-16 mx-auto mb-8 drop-shadow-2xl" />

        {error && <XCircle className="h-14 w-14 text-error mx-auto mb-4 opacity-80" />}
        {isDraft && <Clock className="h-14 w-14 text-zinc-500 mx-auto mb-4 opacity-80" />}
        {(isClosed || isTied) && <div className="h-1 w-12 bg-primary mx-auto mb-6 rounded-full" />}

        <h2 className="text-2xl font-black tracking-tighter text-foreground mb-2 uppercase">
          {error ? "Error" : isDraft ? "Próximamente" : isTied ? "¡Empate!" : "Finalizada"}
        </h2>

        <p className=" text-sm mb-10 font-medium">
          {error || (isDraft ? "La votación aún no ha comenzado." : isTied ? "La batalla terminó en tablas." : "Esta batalla ha concluido.")}
        </p>

        <Link to={isClosed || isTied ? ROUTES.RESULTS(code) : ROUTES.HOME}>
          <Button variant="outline" className="w-full">
            {isClosed || isTied ? "VER RESULTADOS" : "VOLVER"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

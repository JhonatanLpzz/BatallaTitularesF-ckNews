import * as React from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface AppDialogProps {
  /** El título del modal. */
  title: string;
  /** Descripción secundaria (opcional). */
  description?: string;
  /** Booleano para el estado de apertura. */
  isOpen: boolean;
  /** Función para cerrar el modal. */
  onClose: () => void;
  /** Contenido principal del modal. */
  children: React.ReactNode;
  /** Botones de acción o contenido del pie de página (opcional). */
  footer?: React.ReactNode;
  /** Dirección de la animación ("top" | "bottom"). Por defecto "bottom". */
  animation?: "top" | "bottom";
  /** Clases adicionales para el contenedor DialogContent. */
  className?: string;
  /** Clases adicionales para el wrapper del contenido interno. */
  contentClassName?: string;
}

/**
 * AppDialog - Wrapper estandarizado para modales en toda la aplicación.
 * Sigue el patrón de diseño de formularios con etiquetas consistentes y pie de página flexible.
 */
export function AppDialog({
  title,
  description,
  isOpen,
  onClose,
  children,
  footer,
  animation = "bottom",
  className,
  contentClassName,
}: AppDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onClose={onClose}
        animation={animation}
        className={cn("glass-card border-border rounded-[32px] max-w-lg", className)}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-foreground mb-1 tracking-tight">
            {title}
          </DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        <div className={cn("space-y-4 mt-4", contentClassName)}>
          <div className="space-y-4">
            {children}
          </div>

          {footer && (
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              {footer}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * @fileoverview Diálogo modal para mostrar el código QR de una batalla.
 * Permite al admin proyectar el QR para que el público escanee y vote.
 * @module components/QRDialog
 */

import { Clipboard } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { QRResponse } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QRDialogProps {
  /** Datos del QR generado (`null` si el diálogo está cerrado). */
  qrData: QRResponse | null;
  /** Callback para cerrar el diálogo. */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Diálogo modal que muestra el código QR generado para una batalla,
 * junto con la URL de votación y un botón para copiarla al portapapeles.
 *
 * @param props - {@link QRDialogProps}
 */
export function QRDialog({ qrData, onClose }: QRDialogProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(qrData?.url || "");
    toast.success("Enlace copiado al portapapeles");
  };

  return (
    <Dialog open={!!qrData} onOpenChange={() => onClose()}>
      <DialogContent onClose={onClose} className="glass-card border-white/10 sm:max-w-md rounded-[32px] p-8 pb-2 text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground mb-2 tracking-tight">QR de Votación</DialogTitle>
        </DialogHeader>
        <div className="py-6 flex flex-col items-center">
          <div className="bg-white p-6 rounded-[32px] shadow-2xl mb-6">
            <img src={qrData?.qr} alt="QR Code" className="w-56 h-56 md:w-64 md:h-64" />
          </div>

          <div className="w-full space-y-4">
            <p className=" text-sm">Los asistentes pueden escanear este QR o visitar:</p>

            <div className="flex items-center gap-2 bg-black/10 dark:bg-black/30 border border-white/10 p-2 rounded-xl">
              <code className="text-xs md:text-sm font-mono flex-1 truncate px-2">
                {qrData?.url}
              </code>
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0 h-9 rounded-lg px-4 bg-white text-black hover:bg-zinc-200"
                onClick={handleCopy}
              >
                <Clipboard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline font-medium">Copiar</span>
              </Button>
            </div>
          </div>
        </div>
        <Button onClick={onClose} variant="outline">
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  );
}

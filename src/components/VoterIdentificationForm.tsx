/**
 * @fileoverview Formulario de identificación del votante.
 * Se muestra antes de la pantalla de votación para capturar datos del asistente.
 * @module components/VoterIdentificationForm
 */

import { useState } from "react";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VoterIdentificationFormProps {
  /** Título de la batalla que se muestra como encabezado. */
  battleTitle: string;
  /** Callback invocado con los datos del votante al enviar el formulario. */
  onSubmit: (data: { name: string; document: string; phone: string }) => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Formulario de identificación que el público completa antes de votar.
 * Captura nombre (obligatorio), documento y celular (opcionales).
 *
 * @param props - {@link VoterIdentificationFormProps}
 */
export function VoterIdentificationForm({ battleTitle, onSubmit }: VoterIdentificationFormProps) {
  const [voterName, setVoterName] = useState("");
  const [voterDocument, setVoterDocument] = useState("");
  const [voterPhone, setVoterPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (voterName.trim()) {
      onSubmit({
        name: voterName,
        document: voterDocument,
        phone: voterPhone,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 selection:bg-primary/30">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-[460px] animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="glass-card rounded-[40px] border border-white/5 bg-white/[0.02] backdrop-blur-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-6 right-8 opacity-40 hover:opacity-100 transition-opacity">
            <ThemeToggle />
          </div>

          <div className="flex flex-col items-center text-center">
            <img src="/logo_fn.png" alt="Logo" className="h-14 mb-10 drop-shadow-2xl" />

            <h1 className="text-3xl font-black">{battleTitle}</h1>
            <p className=" text-sm mb-10 font-medium">Completa tus datos para habilitar el voto.</p>

            <form onSubmit={handleSubmit} className="w-full space-y-6 text-left">
              <div className="space-y-2">
                <label>Nombre Completo</label>
                <div className="relative">
                  <Input
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    placeholder="Ej. Jhonatan Lopez"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label>Documento</label>
                  <div className="relative">
                    <Input
                      value={voterDocument}
                      onChange={(e) => setVoterDocument(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label>Celular</label>
                  <div className="relative">
                    <Input
                      value={voterPhone}
                      onChange={(e) => setVoterPhone(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                INGRESAR A VOTAR
                <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

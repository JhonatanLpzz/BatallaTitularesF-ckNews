/**
 * @fileoverview Diálogo modal para crear una nueva batalla.
 * Extraído de `AdminPage.tsx` para mejorar la separación de responsabilidades.
 * @module components/CreateBattleDialog
 */

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AppDialog } from "@/components/AppDialog";
import { useAuth } from "@/context/AuthContext";
import { battleService } from "@/services/api";
import {
  DEFAULT_PARTICIPANT_COLORS,
  DEFAULT_PARTICIPANTS,
  MIN_PARTICIPANTS,
  MAX_PARTICIPANTS,
} from "@/constants";
import type { ParticipantInput } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CreateBattleDialogProps {
  /** Controla la visibilidad del diálogo. */
  open: boolean;
  /** Callback para cerrar el diálogo. */
  onOpenChange: (open: boolean) => void;
  /** Callback invocado tras crear una batalla exitosamente. */
  onCreated: () => void;
}

/**
 * Diálogo modal que permite al administrador crear una nueva batalla
 * con título, descripción, duración opcional y lista de participantes.
 */
export function CreateBattleDialog({ open, onOpenChange, onCreated }: CreateBattleDialogProps) {
  const { token } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { ...DEFAULT_PARTICIPANTS[0] },
    { ...DEFAULT_PARTICIPANTS[1] },
  ]);
  const [creating, setCreating] = useState(false);

  // ---- Participant handlers ------------------------------------------------

  const addParticipant = () => {
    if (participants.length >= MAX_PARTICIPANTS) return;
    setParticipants([
      ...participants,
      {
        name: "",
        headline: "[Titular sera dado en vivo]",
        color: DEFAULT_PARTICIPANT_COLORS[participants.length % DEFAULT_PARTICIPANT_COLORS.length],
      },
    ]);
  };

  const removeParticipant = (idx: number) => {
    if (participants.length <= MIN_PARTICIPANTS) return;
    setParticipants(participants.filter((_, i) => i !== idx));
  };

  const updateParticipant = (idx: number, field: keyof ParticipantInput, value: string) => {
    const updated = [...participants];
    updated[idx] = { ...updated[idx], [field]: value };
    setParticipants(updated);
  };

  // ---- Form reset ----------------------------------------------------------

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDurationMinutes("");
    setParticipants([
      { ...DEFAULT_PARTICIPANTS[0] },
      { ...DEFAULT_PARTICIPANTS[1] },
    ]);
  };

  const handleCreate = async () => {
    if (!title.trim()) return toast.error("Ingresa un titulo");
    if (participants.some((p) => !p.name.trim() || !p.headline.trim())) {
      return toast.error("Completa todos los participantes");
    }
    if (!token) return;

    setCreating(true);
    try {
      await battleService.create(token, {
        title,
        description,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        participants,
      });
      toast.success("Batalla creada");
      onOpenChange(false);
      resetForm();
      onCreated();
    } catch {
      toast.error("Error al crear batalla");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Nueva Batalla"
      description="Configura los detalles de la competencia"
      className="max-w-2xl"
      footer={
        <Button
          onClick={handleCreate}
          disabled={creating}
          variant="outline"
          className="flex-1 h-12 rounded-xl"
        >
          {creating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
          {creating ? "Creando..." : "Crear Batalla"}
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Título</label>
          <Input
            placeholder="Ej: Ronda 1 - Noticias Absurdas"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-muted/50 focus-visible:ring-campaign-gold/50 focus-visible:border-campaign-gold"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Descripción (opcional)</label>
          <Textarea
            placeholder="Descripción breve..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="bg-muted/50 focus-visible:ring-campaign-gold/50 focus-visible:border-campaign-gold"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Duración (opcional)</label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="1"
              placeholder="Sin límite"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-32 bg-muted/50 focus-visible:ring-campaign-gold/50 focus-visible:border-campaign-gold"
            />
            <span className="text-sm text-muted-foreground font-medium">minutos</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium">Participantes</label>
            <Button variant="outline" size="sm" onClick={addParticipant}>
              <Plus className="h-4 w-4 mr-1.5" /> Agregar
            </Button>
          </div>

          <div className="space-y-4">
            {participants.map((p, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start bg-muted/50 p-5 rounded-[20px] border border-border relative group transition-colors hover:border-accent">
                <div className="flex-1 w-full space-y-3">
                  <Input
                    placeholder={`Participante ${idx + 1}`}
                    value={p.name}
                    onChange={(e) => updateParticipant(idx, "name", e.target.value)}
                    className="h-11 bg-transparent border-input focus-visible:ring-campaign-gold/50 focus-visible:border-campaign-gold"
                  />
                  <Input
                    placeholder="Titular/Noticia..."
                    value={p.headline}
                    onChange={(e) => updateParticipant(idx, "headline", e.target.value)}
                    className="h-11 bg-transparent border-input focus-visible:ring-campaign-gold/50 focus-visible:border-campaign-gold"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                  <div className="flex items-center gap-2 flex-1 sm:flex-none">
                    <label className="text-xs text-muted-foreground sm:hidden">Color:</label>
                    <input
                      type="color"
                      value={p.color}
                      onChange={(e) => updateParticipant(idx, "color", e.target.value)}
                      className="h-11 w-11 rounded-xl cursor-pointer bg-transparent border-0 p-1 hover:scale-105 transition-transform shrink-0"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeParticipant(idx)}
                    disabled={participants.length <= MIN_PARTICIPANTS}
                    className="h-11 w-11 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppDialog>
  );
}

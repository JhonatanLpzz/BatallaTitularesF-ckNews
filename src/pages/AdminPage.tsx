import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  Play,
  Square,
  QrCode,
  BarChart3,
  Loader2,
  RotateCcw,
  X,
  LogOut,
  Users,
  Swords,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import type { Battle } from "@/types";

interface ParticipantInput {
  name: string;
  headline: string;
  color: string;
}

const DEFAULT_COLORS = ["#1a56a8", "#dc2626", "#10b981", "#f59e0b", "#7c3aed", "#0891b2"];

export default function AdminPage() {
  const navigate = useNavigate();
  const { token, username, logout } = useAuth();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { name: "Camilo Pardo 'El mago'", headline: "[Titular sera dado en vivo]", color: DEFAULT_COLORS[0] },
    { name: "Camilo Sanchez 'El Inquieto'", headline: "[Titular sera dado en vivo]", color: DEFAULT_COLORS[1] },
  ]);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [creating, setCreating] = useState(false);

  const [qrData, setQrData] = useState<{ qr: string; url: string } | null>(null);
  const [qrBattle, setQrBattle] = useState<Battle | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchBattles = useCallback(async () => {
    try {
      const res = await fetch("/api/battles", { headers: authHeaders });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBattles(data);
    } catch {
      toast.error("Error al cargar batallas");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  const addParticipant = () => {
    if (participants.length >= 6) return;
    setParticipants([
      ...participants,
      { name: "", headline: "[Titular sera dado en vivo]", color: DEFAULT_COLORS[participants.length % DEFAULT_COLORS.length] },
    ]);
  };

  const removeParticipant = (idx: number) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter((_, i) => i !== idx));
  };

  const updateParticipant = (idx: number, field: keyof ParticipantInput, value: string) => {
    const updated = [...participants];
    updated[idx] = { ...updated[idx], [field]: value };
    setParticipants(updated);
  };

  const createBattle = async () => {
    if (!title.trim()) return toast.error("Ingresa un titulo");
    if (participants.some((p) => !p.name.trim() || !p.headline.trim())) {
      return toast.error("Completa todos los participantes");
    }

    setCreating(true);
    try {
      const res = await fetch("/api/battles", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          title,
          description,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          participants,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success("Batalla creada");
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setDurationMinutes("");
      setParticipants([
        { name: "Camilo Pardo 'El mago'", headline: "[Titular sera dado en vivo]", color: DEFAULT_COLORS[0] },
        { name: "Camilo Sanchez 'El Inquieto'", headline: "[Titular sera dado en vivo]", color: DEFAULT_COLORS[1] },
      ]);
      fetchBattles();
    } catch {
      toast.error("Error al crear batalla");
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/battles/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ status }),
      });
      toast.success(status === "active" ? "Batalla activada" : "Batalla cerrada");
      fetchBattles();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const deleteBattle = async (id: number) => {
    if (!confirm("Eliminar esta batalla?")) return;
    try {
      await fetch(`/api/battles/${id}`, { method: "DELETE", headers: authHeaders });
      toast.success("Batalla eliminada");
      fetchBattles();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const resetVotes = async (id: number) => {
    if (!confirm("Reiniciar todos los votos?")) return;
    try {
      await fetch(`/api/battles/${id}/votes`, { method: "DELETE", headers: authHeaders });
      toast.success("Votos reiniciados");
    } catch {
      toast.error("Error al reiniciar votos");
    }
  };

  const showQR = async (battle: Battle) => {
    try {
      const base = window.location.origin;
      const res = await fetch(`/api/battles/${battle.code}/qr?base=${encodeURIComponent(base)}`);
      const data = await res.json();
      setQrData(data);
      setQrBattle(battle);
    } catch {
      toast.error("Error al generar QR");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Borrador</Badge>;
      case "active":
        return <Badge variant="success">En Vivo</Badge>;
      case "closed":
        return <Badge variant="warning">Cerrada</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-vote-gradient flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-campaign-gold/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-campaign-blue/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="campaign-accent-bar w-full h-1" />

      <nav className="sticky top-0 z-50 campaign-card border-b border-border/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo_fn.png" alt="F*cks News" className="h-10 drop-shadow-lg" />
            <div>
              <h1 className="text-lg font-bold campaign-gold-gradient">PANEL ADMIN</h1>
              <p className="text-xs text-muted-foreground">Gestión de Batallas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/usuarios")} className="text-foreground hover:text-campaign-gold">
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </Button>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-campaign-gold font-medium">{username}</p>
              <p className="text-[10px] text-muted-foreground">Administrador</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 w-full flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Gestión de Batallas</h1>
            <p className="text-muted-foreground">Crea y administra competencias en tiempo real</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="campaign-button font-semibold">
            <Plus className="h-5 w-5 mr-2" />
            Nueva Batalla
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-campaign-gold" />
          </div>
        ) : battles.length === 0 ? (
          <div className="campaign-card p-12 text-center">
            <Swords className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-2">No hay batallas creadas</p>
            <p className="text-sm text-muted-foreground/60">Crea tu primera batalla épica</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {battles.map((battle, idx) => (
              <div key={battle.id} className="campaign-card p-6 animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{battle.title}</h3>
                      <Badge 
                        variant={battle.status === "active" ? "success" : battle.status === "closed" ? "destructive" : "outline"}
                        className="font-medium"
                      >
                        {battle.status.toUpperCase()}
                      </Badge>
                    </div>
                    {battle.description && (
                      <p className="text-muted-foreground mb-3">{battle.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-mono text-campaign-gold font-semibold">{battle.code}</span>
                      <span className="text-muted-foreground">
                        {new Date(battle.createdAt).toLocaleDateString()}
                      </span>
                      {battle.durationMinutes && (
                        <span className="text-campaign-blue font-medium">
                          {battle.durationMinutes} min timer
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => showQR(battle)} className="hover:border-campaign-gold hover:text-campaign-gold">
                      <QrCode className="h-4 w-4 mr-1" />
                      QR
                    </Button>
                    <Button size="sm" variant="outline" asChild className="hover:border-campaign-blue hover:text-campaign-blue">
                      <Link to={`/resultados/${battle.code}`}>
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Resultados
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={battle.status === "active" ? "destructive" : "default"}
                      onClick={() =>
                        updateStatus(
                          battle.id,
                          battle.status === "active" ? "closed" : "active"
                        )
                      }
                      className={battle.status !== "active" ? "campaign-button" : ""}
                    >
                      {battle.status === "active" ? (
                        <><Square className="h-4 w-4 mr-1" /> Cerrar</>
                      ) : (
                        <><Play className="h-4 w-4 mr-1" /> Activar</>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => resetVotes(battle.id)} className="hover:border-yellow-500 hover:text-yellow-500">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteBattle(battle.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)} className="campaign-card border-border/50 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white mb-2">Nueva Batalla Épica</DialogTitle>
            <p className="text-muted-foreground">Configura los detalles de la competencia</p>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Titulo</label>
              <Input
                placeholder="Ej: Ronda 1 - Noticias Absurdas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Descripcion (opcional)</label>
              <Textarea
                placeholder="Descripcion breve..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Duracion (opcional)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Sin limite"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">minutos</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Participantes</label>
                {participants.length < 6 && (
                  <Button variant="ghost" size="sm" onClick={addParticipant}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Agregar
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {participants.map((p, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <input
                      type="color"
                      value={p.color}
                      onChange={(e) => updateParticipant(idx, "color", e.target.value)}
                      className="w-10 h-10 rounded border border-input cursor-pointer shrink-0"
                    />
                    <div className="flex-1 space-y-1.5">
                      <Input
                        placeholder="Nombre del comediante"
                        value={p.name}
                        onChange={(e) => updateParticipant(idx, "name", e.target.value)}
                      />
                      <Input
                        placeholder="Su titular absurdo..."
                        value={p.headline}
                        onChange={(e) => updateParticipant(idx, "headline", e.target.value)}
                      />
                    </div>
                    {participants.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 mt-0.5"
                        onClick={() => removeParticipant(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={createBattle} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Crear Batalla
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={!!qrData} onOpenChange={() => { setQrData(null); setQrBattle(null); }}>
        <DialogContent onClose={() => { setQrData(null); setQrBattle(null); }} className="text-center">
          <DialogHeader>
            <DialogTitle>{qrBattle?.title}</DialogTitle>
          </DialogHeader>
          {qrData && (
            <div className="space-y-4 mt-4">
              <div className="bg-white rounded-lg border p-4 inline-block mx-auto">
                <img src={qrData.qr} alt="QR Code" className="w-56 h-56 mx-auto" />
              </div>
              <p className="text-sm text-muted-foreground break-all font-mono">{qrData.url}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(qrData.url);
                  toast.success("URL copiada");
                }}
              >
                Copiar URL
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

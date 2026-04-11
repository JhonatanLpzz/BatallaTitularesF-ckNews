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
            <Swords className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Sin Batallas Activas</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">Crea tu primera batalla épica para comenzar la competencia</p>
            <Button onClick={() => setShowCreate(true)} className="campaign-button h-12 px-8">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Batalla
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {battles.map((battle, idx) => (
              <div key={battle.id} className="campaign-card overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                {/* Mobile-Optimized Header */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-border/10">
                  <div className="space-y-4">
                    {/* Title and Status - Mobile Stack */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <h2 className="text-xl sm:text-2xl font-bold text-white">{battle.title}</h2>
                      <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide self-start ${
                        battle.status === 'active' 
                          ? 'bg-gradient-to-r from-green-500/20 to-green-400/20 text-green-300 border border-green-500/30 shadow-lg shadow-green-500/10' 
                          : battle.status === 'closed' 
                          ? 'bg-gradient-to-r from-red-500/20 to-red-400/20 text-red-300 border border-red-500/30'
                          : 'bg-gradient-to-r from-gray-500/20 to-gray-400/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          battle.status === 'active' ? 'bg-green-400 animate-pulse' :
                          battle.status === 'closed' ? 'bg-red-400' : 'bg-gray-400'
                        }`} />
                        {battle.status === 'active' ? 'EN VIVO' : battle.status === 'closed' ? 'CERRADA' : 'BORRADOR'}
                      </div>
                    </div>
                    
                    {/* Description */}
                    {battle.description && (
                      <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{battle.description}</p>
                    )}
                    
                    {/* Mobile-Friendly Metadata */}
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Código:</span>
                        <code className="font-mono text-campaign-gold font-bold text-sm sm:text-base px-2 sm:px-3 py-1 sm:py-1.5 bg-campaign-gold/10 border border-campaign-gold/20 rounded">
                          {battle.code}
                        </code>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6">
                        {battle.durationMinutes && (
                          <div className="flex items-center gap-2 text-campaign-blue font-medium text-sm">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z"/>
                            </svg>
                            {battle.durationMinutes} min
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <span className="hidden sm:inline">Creada:</span>
                          <time>{new Date(battle.createdAt).toLocaleDateString('es-ES', { 
                            day: 'numeric', month: 'short', year: battle.durationMinutes ? undefined : 'numeric' 
                          })}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Mobile-Optimized Action Bar */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 bg-card/20 border-t border-border/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Primary CTA */}
                    <Button
                      size="lg"
                      variant={battle.status === "active" ? "destructive" : "default"}
                      onClick={() =>
                        updateStatus(
                          battle.id,
                          battle.status === "active" ? "closed" : "active"
                        )
                      }
                      className={`w-full sm:w-auto h-12 px-6 sm:px-8 font-semibold text-base ${
                        battle.status !== "active" ? "campaign-button" : ""
                      }`}
                    >
                      {battle.status === "active" ? (
                        <><Square className="h-5 w-5 mr-2 sm:mr-3" />Cerrar Batalla</>
                      ) : (
                        <><Play className="h-5 w-5 mr-2 sm:mr-3" />Activar Batalla</>
                      )}
                    </Button>
                    
                    {/* Secondary Actions - Mobile Stack */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => showQR(battle)} 
                          className="flex-1 sm:flex-none h-11 sm:h-10 px-4 sm:px-6 hover:border-campaign-gold hover:text-campaign-gold font-medium"
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          <span className="sm:hidden">QR</span>
                          <span className="hidden sm:inline">Mostrar QR</span>
                        </Button>
                        
                        <Button variant="outline" asChild className="flex-1 sm:flex-none h-11 sm:h-10 px-4 sm:px-6 hover:border-campaign-blue hover:text-campaign-blue font-medium">
                          <Link to={`/resultados/${battle.code}`}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            <span className="sm:hidden">Resultados</span>
                            <span className="hidden sm:inline">Ver Resultados</span>
                          </Link>
                        </Button>
                      </div>
                      
                      {/* Utility Actions - Mobile Friendly */}
                      <div className="flex items-center gap-2 justify-center sm:justify-start sm:ml-3 sm:border-l sm:border-border/30 sm:pl-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => resetVotes(battle.id)} 
                          className="h-11 sm:h-9 w-11 sm:w-9 p-0 hover:bg-amber-500/10 hover:text-amber-400 rounded-lg"
                          title="Reiniciar votos"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBattle(battle.id)} 
                          className="h-11 sm:h-9 w-11 sm:w-9 p-0 hover:bg-red-500/10 hover:text-red-400 rounded-lg"
                          title="Eliminar batalla"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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

      {/* QR Dialog - Mobile Optimized */}
      <Dialog open={!!qrData} onOpenChange={() => { setQrData(null); setQrBattle(null); }}>
        <DialogContent className="campaign-card max-w-sm mx-4 max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl text-center text-white">{qrBattle?.title}</DialogTitle>
            <p className="text-sm text-muted-foreground text-center">Escanea para votar</p>
          </DialogHeader>
          
          {qrData && (
            <div className="space-y-6 mt-6">
              <div className="bg-white rounded-xl p-4 mx-auto max-w-fit">
                <img 
                  src={qrData.qr} 
                  alt="QR Code" 
                  className="w-48 h-48 sm:w-56 sm:h-56 mx-auto block" 
                />
              </div>
              
              <div className="text-center space-y-4">
                <p className="text-xs text-muted-foreground break-all font-mono px-2 py-2 bg-muted/20 rounded-lg">
                  {qrData.url}
                </p>
                
                <Button
                  variant="outline"
                  className="w-full h-12 font-medium"
                  onClick={() => {
                    navigator.clipboard.writeText(qrData.url);
                    toast.success("URL copiada al portapapeles");
                  }}
                >
                  📋 Copiar URL
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

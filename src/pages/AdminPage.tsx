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
  Clipboard,
  Clock,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Battle } from "@/types";
import { Header } from "@/components/Header";
import { useCountdown } from "@/hooks/useCountdown";

interface ParticipantInput {
  name: string;
  headline: string;
  color: string;
}

const DEFAULT_COLORS = ["#1a56a8", "#dc2626", "#10b981", "#f59e0b", "#7c3aed", "#0891b2"];

export default function AdminPage() {
  const navigate = useNavigate();
  const { token, username, logout, isAuthenticated } = useAuth();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { name: "Camilo Pardo 'El Mago'", headline: "Titulares en vivo...", color: DEFAULT_COLORS[1] },
    { name: "Camilo Sanchez 'El Inquieto'", headline: "Titulares en vivo...", color: DEFAULT_COLORS[0] },
  ]);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [creating, setCreating] = useState(false);

  const [qrData, setQrData] = useState<{ qr: string; url: string } | null>(null);
  const [qrBattle, setQrBattle] = useState<Battle | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchBattles = useCallback(async () => {
    // Don't fetch if not authenticated or still loading auth state
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

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
  }, [token, isAuthenticated]);

  useEffect(() => {
    // Only fetch when auth state is ready and user is authenticated
    if (isAuthenticated && token) {
      fetchBattles();
    } else {
      setLoading(false);
    }
  }, [fetchBattles, isAuthenticated, token]);

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
        { name: "Camilo Pardo 'El mago'", headline: "Titulares en vivo...", color: DEFAULT_COLORS[0] },
        { name: "Camilo Sanchez 'El Inquieto'", headline: "Titulares en vivo...", color: DEFAULT_COLORS[1] },
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
      fetchBattles();
    } catch {
      toast.error("Error al reiniciar votos");
    }
  };

  const handleBattleStatusUpdate = (battleId: number, newStatus: "draft" | "active" | "closed" | "tied" | "tiebreaker") => {
    // Actualizar la batalla en la lista local
    setBattles(prev => prev.map(battle => 
      battle.id === battleId ? { ...battle, status: newStatus } : battle
    ));
    
    // Mostrar notificación del cambio
    if (newStatus === "closed") {
      toast.success("Batalla finalizada automáticamente");
    } else if (newStatus === "tied") {
      toast.warning("Batalla empatada automáticamente");
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

  const startTiebreaker = async (id: number) => {
    try {
      const res = await fetch(`/api/battles/${id}/tiebreaker`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ durationMinutes: 5 }),
      });
      if (!res.ok) throw new Error();
      toast.success("Ronda de desempate iniciada");
      fetchBattles();
    } catch {
      toast.error("Error al iniciar desempate");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <Header
        leftContent={
          <div className="hidden sm:block min-w-0">
            <h1 className="font-bold text-foreground truncate tracking-tight text-lg">PANEL ADMIN</h1>
            <p className="text-muted-foreground text-xs">Gestión de Batallas</p>
          </div>
        }
        rightContent={
          <>
            <Button
              variant="outline"
              size="toggle-icon"
              onClick={() => navigate(location.pathname === '/admin' ? '/admin/usuarios' : '/admin')}
              title={location.pathname === '/admin' ? 'Ver Usuarios' : 'Ver Batallas'}
            >
              {location.pathname === '/admin' ? <Users className="h-5 w-5" /> : <Swords className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors h-9 px-3"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-12 mt-16 md:mt-13 animate-fade-in-up">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">Panel de Control</h1>
            <p className="text-muted-foreground">Gestiona las batallas en tiempo real</p>
          </div>
          <Button onClick={() => setShowCreate(true)} variant="outline">
            <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            Nueva Batalla
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin opacity-50" />
          </div>
        ) : battles.length === 0 ? (
          <div className="glass-card rounded-[32px] text-center py-20 px-6 animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto mt-10">
            <div className="w-24 h-24 bg-white/5 rounded-[24px] mx-auto flex items-center justify-center mb-8 border border-white/10 shadow-2xl transform -rotate-6">
              <Swords className="h-12 w-12 " />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4 tracking-tight">No hay batallas activas</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed text-base">Crea tu primera batalla épica para comenzar la competencia</p>
            <Button onClick={() => setShowCreate(true)} className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-zinc-200 font-semibold shadow-xl hover:-translate-y-1 transition-all">
              <Plus className="h-5 w-5 mr-2" />
              Crear Primera Batalla
            </Button>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {battles
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .map((battle, idx) => (
              <div key={battle.id} className="glass-card rounded-[32px] overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                {/* Mobile-Optimized Header */}
                <div className="px-5 sm:px-8 py-5 sm:py-8 border-b border-white/5 bg-white/[0.01]">
                  <div className="space-y-5">
                    {/* Title and Status - Mobile Stack */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{battle.title}</h2>
                      <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide self-start ${battle.status === 'active'
                        ? 'bg-status-success/10 text-status-success border border-status-success/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : battle.status === 'closed'
                          ? 'bg-white/5 text-muted-foreground border border-white/10'
                          : battle.status === 'tied'
                            ? 'bg-status-warning/10 text-status-warning border border-status-warning/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                            : battle.status === 'tiebreaker'
                              ? 'bg-status-warning/10 text-status-warning border border-status-warning/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                              : 'bg-white/5 text-muted-foreground border border-white/10'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${battle.status === 'active' ? 'bg-status-success animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                          battle.status === 'tiebreaker' ? 'bg-status-warning animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                            battle.status === 'tied' ? 'bg-status-warning shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                              battle.status === 'closed' ? 'bg-muted-foreground' : 'bg-muted-foreground'
                          }`} />
                        {battle.status === 'active' ? 'EN VIVO' :
                          battle.status === 'tied' ? 'EMPATE' :
                            battle.status === 'tiebreaker' ? 'DESEMPATE' :
                              battle.status === 'closed' ? 'CERRADA' : 'BORRADOR'}
                      </div>
                    </div>

                    {/* Description */}
                    {battle.description && (
                      <p className=" leading-relaxed text-sm sm:text-base max-w-3xl">{battle.description}</p>
                    )}

                    {/* Mobile-Friendly Metadata */}
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-6 text-sm pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Código:</span>
                        <code className="font-mono text-foreground font-bold text-sm sm:text-base px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg tracking-wider">
                          {battle.code}
                        </code>
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6">
                        {battle.durationMinutes && (
                          <div className="flex items-center gap-2 text-foreground font-medium text-sm sm:text-base">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {battle.durationMinutes} min
                          </div>
                        )}

                        {/* Timer para batallas activas */}
                        {["active", "tiebreaker"].includes(battle.status) && battle.expiresAt && (
                          <div className="flex items-center gap-2 text-foreground font-medium text-sm sm:text-base">
                            <Timer className="h-4 w-4 text-destructive animate-pulse" />
                            <AdminTimer 
                              expiresAt={battle.expiresAt} 
                              battleId={battle.id}
                              battles={battles}
                              onStatusUpdate={handleBattleStatusUpdate}
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
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
                <div className="px-5 sm:px-8 py-5 sm:py-6 bg-black/10 dark:bg-black/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    {/* Primary CTA */}
                    {battle.status === "tied" ? (
                      <Button
                        size="lg"
                        onClick={() => startTiebreaker(battle.id)}
                        className="w-full sm:w-auto h-12 px-6 sm:px-8 font-semibold rounded-xl bg-orange-500 text-foreground hover:bg-orange-600 shadow-lg shadow-orange-500/20 border-0"
                      >
                        <Play className="h-5 w-5 mr-2 sm:mr-3" />Iniciar Desempate
                      </Button>
                    ) : battle.status === "tiebreaker" ? (
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={() => updateStatus(battle.id, "closed")}
                        className="w-full sm:w-auto h-12 px-6 sm:px-8 font-semibold rounded-xl border-0"
                      >
                        <Square className="h-5 w-5 mr-2 sm:mr-3" />Cerrar Desempate
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant={battle.status === "active" ? "destructive" : "default"}
                        onClick={() =>
                          updateStatus(
                            battle.id,
                            battle.status === "active" ? "closed" : "active"
                          )
                        }
                        className={cn(
                          "w-full sm:w-auto h-12 px-6 sm:px-8 font-semibold rounded-xl border-0 transition-all",
                          battle.status !== "active" ? "bg-white text-black hover:bg-zinc-200" : ""
                        )}
                      >
                        {battle.status === "active" ? (
                          <><Square className="h-5 w-5 mr-2 sm:mr-3" />Cerrar Batalla</>
                        ) : (
                          <><Play className="h-5 w-5 mr-2 sm:mr-3" />Activar Batalla</>
                        )}
                      </Button>
                    )}

                    {/* Secondary Actions - Mobile Stack */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-3">
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => showQR(battle)}
                          className="flex-1 sm:flex-none h-12 sm:h-11 px-5 sm:px-6 rounded-xl hover:bg-white/10 text-foreground border-white/10"
                        >
                          <QrCode className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                          <span className="sm:hidden">QR</span>
                          <span className="hidden sm:inline">Mostrar QR</span>
                        </Button>

                        <Button variant="outline" asChild className="flex-1 sm:flex-none h-12 sm:h-11 px-5 sm:px-6 rounded-xl hover:bg-white/10 text-foreground border-white/10">
                          <Link to={`/resultados/${battle.code}`}>
                            <BarChart3 className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                            <span className="sm:hidden">Resultados</span>
                            <span className="hidden sm:inline">Ver Resultados</span>
                          </Link>
                        </Button>
                      </div>

                      {/* Utility Actions - Mobile Friendly */}
                      <div className="flex items-center justify-center gap-3 mt-2 sm:mt-0 sm:justify-start sm:ml-4 sm:border-l sm:border-white/10 sm:pl-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetVotes(battle.id)}
                          className="h-12 sm:h-11 w-12 sm:w-11 p-0 hover:bg-amber-500/10 hover:text-amber-400  rounded-xl"
                          title="Reiniciar votos"
                        >
                          <RotateCcw className="h-5 w-5 sm:h-4 sm:w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBattle(battle.id)}
                          className="h-12 sm:h-11 w-12 sm:w-11 p-0 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-xl"
                          title="Eliminar batalla"
                        >
                          <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
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
        <DialogContent onClose={() => setShowCreate(false)} className="glass-card border-white/10 max-w-2xl rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground mb-2 tracking-tight">Nueva Batalla</DialogTitle>
            <p className=" text-sm">Configura los detalles de la competencia</p>
          </DialogHeader>

          <div className="space-y-5 mt-6">
            <div>
              <label className="text-[13px]  ml-1 font-medium mb-1.5 block">Título</label>
              <Input
                placeholder="Ej: Ronda 1 - Noticias Absurdas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[13px]  ml-1 font-medium mb-1.5 block">Descripción (opcional)</label>
              <Textarea
                placeholder="Descripción breve..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <label className="text-[13px]  ml-1 font-medium mb-1.5 block">Duración (opcional)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  placeholder="Sin límite"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground font-medium">minutos</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[13px]  ml-1 font-medium">Participantes</label>
                <Button variant="outline" size="sm" onClick={addParticipant}>
                  <Plus className="h-3 w-3 mr-1.5" /> Agregar
                </Button>
              </div>

              <div className="space-y-3">
                {participants.map((p, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start bg-white/[0.02] p-4 rounded-2xl border border-white/5 relative group transition-colors hover:bg-white/[0.04]">
                    <div className="flex-1 w-full space-y-3">
                      <Input
                        placeholder={`Participante ${idx + 1}`}
                        value={p.name}
                        onChange={(e) => updateParticipant(idx, "name", e.target.value)}
                        className="h-11"
                      />
                      <Input
                        placeholder="Titular/Noticia..."
                        value={p.headline}
                        onChange={(e) => updateParticipant(idx, "headline", e.target.value)}
                        className="h-11"
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
                        disabled={participants.length <= 2}
                        className="h-11 w-11 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={createBattle}
              disabled={creating}
              variant="outline"
            >
              {creating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
              {creating ? "Creando..." : "Crear Batalla"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={!!qrData} onOpenChange={() => setQrData(null)}>
        <DialogContent onClose={() => setQrData(null)} className="glass-card border-white/10 sm:max-w-md rounded-[32px] p-8 pb-2 text-center">
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
                  onClick={() => {
                    navigator.clipboard.writeText(qrData?.url || "");
                    toast.success("Enlace copiado al portapapeles");
                  }}
                >
                  <Clipboard className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline font-medium">Copiar</span>
                </Button>
              </div>
            </div>
          </div>
          <Button onClick={() => setQrData(null)} variant="outline">
            Cerrar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminTimer({ expiresAt, battleId, battles, onStatusUpdate }: { 
  expiresAt: string | null | undefined; 
  battleId: number;
  battles: Battle[];
  onStatusUpdate: (battleId: number, newStatus: "draft" | "active" | "closed" | "tied" | "tiebreaker") => void;
}) {
  const countdown = useCountdown(expiresAt || "");
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // Cuando el timer expira y no se ha disparado antes
    if (countdown?.isExpired && !hasTriggered) {
      setHasTriggered(true);
      
      // Llamar a la API para actualizar el estado
      const updateBattleStatus = async () => {
        try {
          // Obtener la batalla actualizada usando el código
          const battle = battles.find(b => b.id === battleId);
          if (!battle) return;
          
          const response = await fetch(`/api/battles/${battle.code}`);
          
          if (response.ok) {
            const updatedBattle = await response.json();
            onStatusUpdate(battleId, updatedBattle.status);
          }
        } catch (error) {
          console.error('Error al actualizar estado de batalla:', error);
        }
      };

      updateBattleStatus();
    }
  }, [countdown?.isExpired, hasTriggered, battleId, onStatusUpdate]);

  return (
    <span className="font-mono text-destructive tabular-nums tracking-tighter leading-none">
      {countdown?.isExpired ? "FINAL" : countdown?.display || "00:00"}
    </span>
  );
}

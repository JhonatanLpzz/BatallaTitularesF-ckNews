/**
 * @fileoverview Panel de administración de batallas.
 * Permite crear, activar, cerrar, eliminar batallas y gestionar QRs.
 * Refactorizado: lógica de creación en {@link CreateBattleDialog},
 * QR en {@link QRDialog}, timer en {@link AdminTimer}.
 * @module pages/AdminPage
 */

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
  LogOut,
  Users,
  Swords,
  Clock,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { battleService } from "@/services/api";
import { ROUTES, LIVE_STATUSES, BATTLE_STATUS, DEFAULT_TIEBREAKER_DURATION } from "@/constants";
import type { Battle, QRResponse } from "@/types";
import type { BattleStatusType } from "@/constants";
import { Header } from "@/components/Header";
import { AdminTimer } from "@/components/AdminTimer";
import { CreateBattleDialog } from "@/components/CreateBattleDialog";
import { QRDialog } from "@/components/QRDialog";

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const navigate = useNavigate();
  const { token, logout, isAuthenticated, isDemo } = useAuth();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [qrData, setQrData] = useState<QRResponse | null>(null);

  // ---- Data fetching -------------------------------------------------------

  const fetchBattles = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    try {
      const data = await battleService.list(token);
      setBattles(data);
    } catch {
      toast.error("Error al cargar batallas");
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchBattles();
    } else {
      setLoading(false);
    }
  }, [fetchBattles, isAuthenticated, token]);

  // ---- Battle actions ------------------------------------------------------

  const updateStatus = async (id: number, status: string) => {
    if (!token) return;
    try {
      await battleService.updateStatus(token, id, status);
      toast.success(status === BATTLE_STATUS.ACTIVE ? "Batalla activada" : "Batalla cerrada");
      fetchBattles();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const deleteBattle = async (id: number) => {
    if (!confirm("Eliminar esta batalla?") || !token) return;
    try {
      await battleService.delete(token, id);
      toast.success("Batalla eliminada");
      fetchBattles();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const resetVotes = async (id: number) => {
    if (!confirm("Reiniciar todos los votos?") || !token) return;
    try {
      await battleService.resetVotes(token, id);
      toast.success("Votos reiniciados");
      fetchBattles();
    } catch {
      toast.error("Error al reiniciar votos");
    }
  };

  const startTiebreaker = async (id: number) => {
    if (!token) return;
    try {
      await battleService.startTiebreaker(token, id, DEFAULT_TIEBREAKER_DURATION);
      toast.success("Ronda de desempate iniciada");
      fetchBattles();
    } catch {
      toast.error("Error al iniciar desempate");
    }
  };

  const handleBattleStatusUpdate = (battleId: number, newStatus: BattleStatusType) => {
    setBattles((prev) =>
      prev.map((battle) => (battle.id === battleId ? { ...battle, status: newStatus } : battle)),
    );
    if (newStatus === BATTLE_STATUS.CLOSED) toast.success("Batalla finalizada automáticamente");
    else if (newStatus === BATTLE_STATUS.TIED) toast.warning("Batalla empatada automáticamente");
  };

  const showQR = async (battle: Battle) => {
    try {
      const data = await battleService.getQR(battle.code, window.location.origin);
      setQrData(data);
    } catch {
      toast.error("Error al generar QR");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  // ---- Render --------------------------------------------------------------

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
              onClick={() => navigate(location.pathname === ROUTES.ADMIN ? ROUTES.ADMIN_USERS : ROUTES.ADMIN)}
              title={location.pathname === ROUTES.ADMIN ? "Ver Usuarios" : "Ver Batallas"}
            >
              {location.pathname === ROUTES.ADMIN ? <Users className="h-5 w-5" /> : <Swords className="h-5 w-5" />}
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

      {isDemo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center">
          <span className="text-xs font-bold tracking-wider uppercase text-amber-400">Modo Demo — Solo lectura</span>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-12 mt-16 md:mt-13 animate-fade-in-up">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">Panel de Control</h1>
            <p className="text-muted-foreground">Gestiona las batallas en tiempo real</p>
          </div>
          {!isDemo && (
            <Button onClick={() => setShowCreate(true)} variant="outline">
              <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Nueva Batalla
            </Button>
          )}
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
                        {LIVE_STATUSES.includes(battle.status) && battle.expiresAt && (
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
                    {!isDemo && (
                    <>{battle.status === BATTLE_STATUS.TIED ? (
                      <Button
                        size="lg"
                        onClick={() => startTiebreaker(battle.id)}
                        className="w-full sm:w-auto h-12 px-6 sm:px-8 font-semibold rounded-xl bg-orange-500 text-foreground hover:bg-orange-600 shadow-lg shadow-orange-500/20 border-0"
                      >
                        <Play className="h-5 w-5 mr-2 sm:mr-3" />Iniciar Desempate
                      </Button>
                    ) : battle.status === BATTLE_STATUS.TIEBREAKER ? (
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={() => updateStatus(battle.id, BATTLE_STATUS.CLOSED)}
                        className="w-full sm:w-auto h-12 px-6 sm:px-8 font-semibold rounded-xl border-0"
                      >
                        <Square className="h-5 w-5 mr-2 sm:mr-3" />Cerrar Desempate
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant={battle.status === BATTLE_STATUS.ACTIVE ? "destructive" : "default"}
                        onClick={() =>
                          updateStatus(
                            battle.id,
                            battle.status === BATTLE_STATUS.ACTIVE ? BATTLE_STATUS.CLOSED : BATTLE_STATUS.ACTIVE,
                          )
                        }
                        className={cn(
                          "w-full sm:w-auto h-12 px-6 sm:px-8 font-semibold rounded-xl border-0 transition-all",
                          battle.status !== BATTLE_STATUS.ACTIVE ? "bg-white text-black hover:bg-zinc-200" : "",
                        )}
                      >
                        {battle.status === BATTLE_STATUS.ACTIVE ? (
                          <><Square className="h-5 w-5 mr-2 sm:mr-3" />Cerrar Batalla</>
                        ) : (
                          <><Play className="h-5 w-5 mr-2 sm:mr-3" />Activar Batalla</>
                        )}
                      </Button>
                    )}</>
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
                          <Link to={ROUTES.RESULTS(battle.code)}>
                            <BarChart3 className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                            <span className="sm:hidden">Resultados</span>
                            <span className="hidden sm:inline">Ver Resultados</span>
                          </Link>
                        </Button>
                      </div>

                      {/* Utility Actions - Mobile Friendly */}
                      {!isDemo && (
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
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <CreateBattleDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={fetchBattles}
      />
      <QRDialog qrData={qrData} onClose={() => setQrData(null)} />
    </div>
  );
}

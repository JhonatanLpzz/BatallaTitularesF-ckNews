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
import { useHeader } from "@/context/HeaderContext";
import { AdminTimer } from "@/components/AdminTimer";
import { CreateBattleDialog } from "@/components/CreateBattleDialog";
import { QRDialog } from "@/components/QRDialog";
import { AppDialog } from "@/components/AppDialog";

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
  const [battleToDelete, setBattleToDelete] = useState<Battle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { setHeaderContent, resetHeader } = useHeader();

  useEffect(() => {
    setHeaderContent({
      leftContent: (
        <div className="hidden sm:block min-w-0">
          <h1 className="font-bold text-foreground truncate tracking-tight text-lg">PANEL ADMIN</h1>
          <p className="text-muted-foreground text-xs">Gestión de Batallas</p>
        </div>
      ),
      rightContent: (
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
      )
    });
    return () => resetHeader();
  }, [location.pathname, navigate, setHeaderContent, resetHeader]);

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

  const deleteBattle = async () => {
    if (!battleToDelete || !token) return;
    setIsDeleting(true);
    try {
      await battleService.delete(token, battleToDelete.id);
      toast.success("Batalla eliminada correctamente");
      setBattleToDelete(null);
      fetchBattles();
    } catch {
      toast.error("Error al eliminar la batalla");
    } finally {
      setIsDeleting(false);
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
    <div className="min-h-screen text-foreground flex flex-col relative selection:bg-campaign-blue/30">

      {isDemo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center">
          <span className="text-xs font-bold tracking-wider uppercase text-amber-400">Modo Demo — Solo lectura</span>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-12 mt-5 md:mt-4 animate-fade-in-up">
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
          <div className="glass-card text-center py-20 px-6 animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto mt-10">
            <div className="w-24 h-24 bg-accent rounded-[24px] mx-auto flex items-center justify-center mb-8 border border-white/10 shadow-2xl transform -rotate-6">
              <Swords className="h-12 w-12 " />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4 tracking-tight">No hay batallas activas</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed text-base">Crea tu primera batalla épica para comenzar la competencia</p>
            <Button onClick={() => setShowCreate(true)} size="lg" className="shadow-xl hover:-translate-y-1 transition-all">
              <Plus className="h-5 w-5 mr-2" />
              Crear Primera Batalla
            </Button>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {battles
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((battle, idx) => (
              <div key={battle.id} className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                {/* Mobile-Optimized Header */}
                <div className="px-5 sm:px-8 py-5 sm:py-8 border-b border-border bg-muted/5">
                  <div className="space-y-5">
                    {/* Title and Status - Mobile Stack */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{battle.title}</h2>
                      <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide self-start ${battle.status === 'active'
                        ? 'bg-status-success/10 text-status-success border border-status-success/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : battle.status === 'closed'
                          ? 'bg-secondary text-muted-foreground border border-border'
                          : battle.status === 'tied'
                            ? 'bg-status-warning/10 text-status-warning border border-status-warning/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                            : battle.status === 'tiebreaker'
                              ? 'bg-status-warning/10 text-status-warning border border-status-warning/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                              : 'bg-secondary text-muted-foreground border border-border'
                        }`}>
                        <span className="relative flex items-center justify-center h-2 w-2">
                          {(battle.status === 'active' || battle.status === 'tiebreaker') && (
                            <span className={cn(
                              "animate-ping absolute inset-0 inline-flex h-full w-full rounded-full opacity-75",
                              battle.status === 'active' ? 'bg-status-success' : 'bg-status-warning'
                            )} />
                          )}
                          <span className={cn(
                            "relative inline-flex rounded-full h-2 w-2 shadow-[0_0_10px_rgba(0,0,0,0.2)]",
                            battle.status === 'active' ? 'bg-status-success' :
                            (battle.status === 'tiebreaker' || battle.status === 'tied') ? 'bg-status-warning' :
                            'bg-muted-foreground'
                          )} />
                        </span>
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
                        <code className="font-mono text-foreground font-bold text-sm sm:text-base px-3 py-1.5 bg-secondary border border-border rounded-lg tracking-wider">
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
                <div className="px-5 sm:px-8 py-5 sm:py-6 bg-muted/20">
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
                          battle.status !== BATTLE_STATUS.ACTIVE ? "" : "",
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
                          className="flex-1 sm:flex-none h-12 sm:h-11 px-5 sm:px-6 rounded-xl"
                        >
                          <QrCode className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                          <span className="sm:hidden">QR</span>
                          <span className="hidden sm:inline">Mostrar QR</span>
                        </Button>

                        <Button variant="outline" asChild className="flex-1 sm:flex-none h-12 sm:h-11 px-5 sm:px-6 rounded-xl">
                          <Link to={ROUTES.RESULTS(battle.code)}>
                            <BarChart3 className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                            <span className="sm:hidden">Resultados</span>
                            <span className="hidden sm:inline">Ver Resultados</span>
                          </Link>
                        </Button>
                      </div>

                      {/* Utility Actions - Mobile Friendly */}
                      {!isDemo && (
                      <div className="flex items-center justify-center gap-3 mt-2 sm:mt-0 sm:justify-start sm:ml-4 sm:border-l sm:border-border sm:pl-4">
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
                          onClick={() => setBattleToDelete(battle)}
                          className="h-12 sm:h-11 w-12 sm:w-11 p-0 hover:bg-destructive/10 hover:text-destructive rounded-xl"
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

      {/* Delete Confirmation Dialog */}
      <AppDialog
        isOpen={!!battleToDelete}
        onClose={() => !isDeleting && setBattleToDelete(null)}
        title="¿Eliminar Batalla?"
        description={`Esta acción eliminará "${battleToDelete?.title}" de forma permanente, incluyendo todos sus participantes y votos registrados.`}
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setBattleToDelete(null)}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={deleteBattle}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl shadow-lg shadow-destructive/20"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Ahora"
              )}
            </Button>
          </div>
        }
      >
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex gap-3 items-start">
          <Trash2 className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive/90 leading-relaxed">
            Esta es una acción <strong>irreversible</strong>. No podrás recuperar los datos una vez borrados.
          </p>
        </div>
      </AppDialog>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Clock, User, Timer, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, generateFingerprint } from "@/lib/utils";
import type { Battle, Participant, VoteUpdate } from "@/types";
import { useSSE } from "@/hooks/useSSE";
import { useCountdown } from "@/hooks/useCountdown";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function VotePage() {
  const { code } = useParams<{ code: string }>();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [voterName, setVoterName] = useState("");
  const [voterDocument, setVoterDocument] = useState("");
  const [voterPhone, setVoterPhone] = useState("");
  const [voterReady, setVoterReady] = useState(false);
  const [expired, setExpired] = useState(false);

  const fetchBattle = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/battles/${code}`);
      if (!res.ok) throw new Error("No encontrada");
      const data = await res.json();
      setBattle(data);
      const fp = generateFingerprint();
      const voteCheck = await fetch(`/api/votes/check/${code}?fp=${fp}`);
      const { hasVoted: voted } = await voteCheck.json();
      setHasVoted(voted);
      if (voted) setVoterReady(true);
    } catch {
      setError("Batalla no encontrada");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { fetchBattle(); }, [fetchBattle]);

  useSSE(code, {
    enabled: !!battle && (battle.status === "active" || battle.status === "tiebreaker"),
    onMessage: (data) => {
      const update = data as VoteUpdate;
      if (update.type === "vote_update" && battle) {
        setBattle((prev) => prev ? { ...prev, participants: update.participants, totalVotes: update.totalVotes } : prev);
      }
    },
  });

  const castVote = async (participantId: number) => {
    if (!code || hasVoted || !voterReady) return;
    setVoting(participantId);
    try {
      const fp = generateFingerprint();
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleCode: code,
          participantId,
          fingerprint: fp,
          voterName: voterName.trim(),
          voterDocument: voterDocument.trim() || undefined,
          voterPhone: voterPhone.trim() || undefined,
        }),
      });
      if (res.status === 409) { setHasVoted(true); return; }
      if (!res.ok) throw new Error("Error al votar");
      setHasVoted(true);
      setVotedFor(participantId);
      toast.success("Voto registrado con éxito");
    } catch (err) {
      toast.error("No se pudo registrar el voto");
    } finally { setVoting(null); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 border-t-2 border-campaign-gold rounded-full animate-spin opacity-20" />
        <Loader2 className="h-6 w-6 animate-spin text-campaign-gold" />
      </div>
    </div>
  );

  if (error || !battle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
        <div className="glass-card rounded-[32px] p-8 text-center max-w-sm w-full">
          <XCircle className="h-12 w-12 text-campaign-red mx-auto mb-3 opacity-80" />
          <h2 className="text-lg font-semibold mb-2 text-white">{error || "Error"}</h2>
          <Link to="/">
            <Button className="bg-white/10 hover:bg-white/20 text-white rounded-xl mt-4">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (battle.status === "draft") {
    return (
      <div key="draft" className="min-h-screen flex items-center justify-center bg-[#050505] px-4 animate-fade-in-up">
        <div className="glass-card rounded-[32px] p-8 text-center max-w-sm w-full">
          <Clock className="h-12 w-12 text-zinc-500 mx-auto mb-3 opacity-80" />
          <h2 className="text-lg font-semibold mb-1 text-white">Aún no comienza</h2>
          <p className="text-sm text-zinc-400">La votación se activará pronto...</p>
        </div>
      </div>
    );
  }

  if (battle.status === "closed") {
    return (
      <div key="closed" className="min-h-screen flex items-center justify-center bg-[#050505] px-4 relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-campaign-gold/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="glass-card rounded-[32px] p-10 text-center max-w-sm w-full z-10">
          <img src="/logo_fn.png" alt="F*cks News" className="h-14 mx-auto mb-6 drop-shadow-2xl" />
          <h2 className="text-xl font-semibold mb-2 text-white">Batalla Cerrada</h2>
          <p className="text-sm text-zinc-400 mb-8">La votación ha terminado</p>
          <Link to={`/resultados/${code}`}>
            <Button className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl font-semibold">
              Ver Resultados
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (battle.status === "tied") {
    return (
      <div key="tied" className="min-h-screen flex items-center justify-center bg-[#050505] px-4 relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-campaign-gold/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="glass-card rounded-[32px] p-10 text-center max-w-sm w-full z-10">
          <img src="/logo_fn.png" alt="F*cks News" className="h-14 mx-auto mb-6 drop-shadow-2xl" />
          <h2 className="text-xl font-bold mb-2 text-campaign-gold">¡Empate!</h2>
          <p className="text-sm text-zinc-300 mb-2">
            La batalla terminó en empate.
          </p>
          <p className="text-xs text-zinc-500 mb-8">
            El administrador puede iniciar una ronda de desempate.
          </p>
          <Link to={`/resultados/${code}`}>
            <Button className="w-full bg-white/[0.05] border border-white/10 hover:bg-white/10 text-white rounded-xl font-medium">
              Ver Resultados
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- RENDER DE IDENTIFICACIÓN (ESTILO APPLE GLASS) ---
  if (!voterReady && !hasVoted) {
    return (
      <div key="auth" className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 selection:bg-campaign-gold/30 animate-fade-in-up">
        {/* Background blobs decorativos */}
        <div className="fixed inset-0 overflow-hidden -z-10">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-campaign-red/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-campaign-gold/5 blur-[120px] rounded-full delay-1000" />
        </div>

        <div className="w-full max-w-[440px] relative">
          <div className="glass-card absolute inset-0 rounded-[32px] -z-10" />
          
          <div className="p-8 sm:p-10 flex flex-col items-center">
            <img src="/logo_fn.png" alt="Logo" className="h-16 mb-8 drop-shadow-2xl" />
            <h1 className="text-2xl font-semibold tracking-tight text-center mb-2">{battle?.title}</h1>
            <p className="text-zinc-400 text-center text-sm mb-8 leading-relaxed">Ingresa tus datos para participar en la votación en tiempo real.</p>

            <form onSubmit={(e) => { e.preventDefault(); voterName.trim() && setVoterReady(true); }} className="w-full space-y-4">
              <div className="space-y-1.5 font-medium">
                <label className="text-[13px] text-zinc-400 ml-1">Nombre Completo</label>
                <Input 
                  value={voterName}
                  onChange={e => setVoterName(e.target.value)}
                  className="bg-white/[0.05] border-white/5 h-12 rounded-xl focus:ring-campaign-gold/20 focus:border-campaign-gold/40 transition-all text-white"
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] text-zinc-400 ml-1 font-medium text-xs">Documento (Opc)</label>
                  <Input 
                    value={voterDocument}
                    onChange={e => setVoterDocument(e.target.value)}
                    className="bg-white/[0.05] border-white/5 h-12 rounded-xl text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] text-zinc-400 ml-1 font-medium text-xs">Celular (Opc)</label>
                  <Input 
                    value={voterPhone}
                    onChange={e => setVoterPhone(e.target.value)}
                    className="bg-white/[0.05] border-white/5 h-12 rounded-xl text-white"
                  />
                </div>
              </div>

              <Button className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-semibold transition-all mt-4 group">
                Empezar a votar
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER DE VOTACIÓN ---
  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 flex flex-col font-sans selection:bg-campaign-gold/30">
      {/* Background blobs for voting */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[30%] -right-[20%] w-[50%] h-[50%] bg-campaign-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-campaign-blue/5 blur-[120px] rounded-full" />
      </div>

      {/* Header Estilo Apple Glass */}
      <nav className="sticky top-0 z-50 bg-[#080808]/60 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo_fn.png" alt="FN" className="h-10 w-auto" />
            <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
            <h2 className="text-sm font-medium hidden sm:block max-w-[200px] truncate opacity-80">{battle?.title}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="block text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-bold">Total Votos</span>
              <span className="text-lg font-semibold tabular-nums text-campaign-gold tracking-tight">{battle?.totalVotes || 0}</span>
            </div>
            <VoteTimer expiresAt={battle?.expiresAt} expired={expired} onExpire={() => setExpired(true)} />
          </div>
        </div>
      </nav>

      {/* Tiebreaker Banner */}
      {battle?.status === "tiebreaker" && (
        <div className="bg-campaign-gold/10 border-b border-campaign-gold/20 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 text-campaign-gold animate-pulse" />
            <span className="text-sm font-medium text-campaign-gold tracking-wide">RONDA DE DESEMPATE ACTIVA</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {hasVoted && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-campaign-gold/5 border border-campaign-gold/20 rounded-[28px] p-6 flex flex-col items-center text-center backdrop-blur-md">
              <div className="h-12 w-12 bg-campaign-gold rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <CheckCircle2 className="text-black h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-campaign-gold">¡Voto registrado!</h3>
              <p className="text-zinc-400 text-sm">Mira cómo cambian los resultados en tiempo real.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {battle?.participants?.map((participant: Participant, idx: number) => {
            const isVotedFor = votedFor === participant.id;
            // Solo permitir votar por participantes empatados si es tiebreaker
            const isTiebreakerDisabled = battle.status === "tiebreaker" && battle.tiedParticipantIds && !battle.tiedParticipantIds.includes(participant.id);
            const isDisabled = hasVoted || voting !== null || isTiebreakerDisabled;
            
            return (
              <button
                key={participant.id}
                onClick={() => !isDisabled && castVote(participant.id)}
                disabled={isDisabled}
                className={cn(
                  "relative w-full text-left rounded-[28px] overflow-hidden transition-all duration-500 group",
                  "bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.05]",
                  isDisabled && !hasVoted ? "cursor-not-allowed opacity-50" : (hasVoted ? "cursor-default" : "cursor-pointer active:scale-[0.98]"),
                  isVotedFor && "border-campaign-gold/40 bg-campaign-gold/[0.02]"
                )}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Capa de progreso "Líquida" */}
                {hasVoted && (
                  <div 
                    className="absolute inset-y-0 left-0 transition-all duration-[1500ms] ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden"
                    style={{ 
                      width: `${participant.percentage}%`, 
                    }}
                  >
                    <div 
                      className="absolute inset-0 opacity-[0.15]" 
                      style={{ backgroundColor: participant.color }}
                    />
                    {/* Shimmer effect inside the bar */}
                    {participant.percentage > 0 && (
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    )}
                    {/* Right edge glow */}
                    <div 
                      className="absolute top-0 bottom-0 right-0 w-1 opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      style={{ backgroundColor: participant.color }} 
                    />
                  </div>
                )}

                <div className="relative p-6 sm:p-8 flex items-center justify-between gap-6">
                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                        style={{ backgroundColor: participant.color }}
                      />
                      <span className="text-xs font-bold tracking-widest uppercase text-zinc-400">{participant.name}</span>
                    </div>
                    <p className="text-lg sm:text-xl font-medium leading-snug tracking-tight text-white/90 drop-shadow-sm">
                      "{participant.headline}"
                    </p>
                  </div>

                  {hasVoted ? (
                    <div className="text-right shrink-0 z-10">
                      <span className="text-3xl sm:text-4xl font-bold tracking-tighter block drop-shadow-sm" style={{ color: participant.color }}>
                        {participant.percentage}%
                      </span>
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">
                        {participant.votes.toLocaleString()} votos
                      </span>
                    </div>
                  ) : (
                    <div className={cn(
                      "h-10 w-10 rounded-full border flex items-center justify-center transition-all shrink-0 z-10",
                      isTiebreakerDisabled ? "border-white/5 text-white/20" : "border-white/10 group-hover:bg-white group-hover:text-black text-white"
                    )}>
                      {voting === participant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!hasVoted && (
          <p className="text-center text-sm sm:text-base text-muted-foreground mt-6 sm:mt-8 font-medium px-4 animate-pulse">
            Selecciona el titular que más te guste para votar
          </p>
        )}
      </main>

      {/* Footer minimalista Apple Style */}
      <footer className="mt-auto border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xl mx-auto">
            Un tributo a la comedia de <span className="text-zinc-300 font-medium">F*cks News Noticreo</span>. 
            Gracias por el apoyo y las risas constantes.
          </p>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold">Desarrollado por</span>
            <span className="text-sm font-medium bg-gradient-to-r from-campaign-gold to-yellow-200 bg-clip-text text-transparent">
              Jhonatan Lopez Conde
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function VoteTimer({ expiresAt, expired, onExpire }: { expiresAt?: string | null; expired: boolean; onExpire: () => void }) {
  const countdown = useCountdown(expiresAt || "");

  useEffect(() => {
    if (countdown?.isExpired && !expired) onExpire();
  }, [countdown, expired, onExpire]);

  if (!expiresAt) return null;

  return (
    <div className="pl-6 border-l border-white/10 flex flex-col items-end">
      <span className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-bold mb-0.5">Cierre en</span>
      <div className="flex items-center gap-2">
        <Timer className="h-3.5 w-3.5 text-campaign-red" />
        <span className="text-lg font-mono font-bold text-campaign-red tabular-nums tracking-tighter drop-shadow-sm">
          {countdown?.isExpired || expired ? "FINALIZADA" : countdown?.display || "00:00"}
        </span>
      </div>
    </div>
  );
}
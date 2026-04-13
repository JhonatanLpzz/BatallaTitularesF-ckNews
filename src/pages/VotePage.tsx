import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Timer,
  ChevronRight,
  AlertTriangle,
  User,
  Phone,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn, generateFingerprint } from "@/lib/utils";
import type { Battle, Participant, VoteUpdate } from "@/types";
import { useSSE } from "@/hooks/useSSE";
import { useCountdown } from "@/hooks/useCountdown";
import { Header } from "@/components/Header";

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
      const { hasVoted: voted, participantId } = await voteCheck.json();
      setHasVoted(voted);
      setVotedFor(participantId ?? null);
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
      toast.success("¡Voto registrado!");
    } catch (err) {
      toast.error("No se pudo registrar el voto");
    } finally { setVoting(null); }
  };

  const changeVote = async (participantId: number) => {
    if (!code || !hasVoted || !voterReady || votedFor === participantId) return;
    setVoting(participantId);
    try {
      const fp = generateFingerprint();
      const res = await fetch("/api/votes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleCode: code,
          participantId,
          fingerprint: fp,
        }),
      });
      if (!res.ok) throw new Error("Error");
      setVotedFor(participantId);
      toast.success("Voto actualizado");
    } catch {
      toast.error("No se pudo cambiar el voto");
    } finally { setVoting(null); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 border-t-2 border-campaign-gold rounded-full animate-spin opacity-20" />
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </div>
  );

  // --- ESTADOS DE ERROR / DRAFT / CLOSED ---
  if (error || !battle || battle.status === "draft" || battle.status === "closed" || battle.status === "tied") {
    const isClosed = battle?.status === "closed";
    const isTied = battle?.status === "tied";
    const isDraft = battle?.status === "draft";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-campaign-gold/5 blur-[120px] rounded-full" />

        <div className="glass-card rounded-[40px] border border-white/5 bg-white/[0.02] p-10 text-center max-w-sm w-full z-10 backdrop-blur-3xl animate-in fade-in zoom-in duration-700">
          <img src="/logo_fn.png" alt="Logo" className="h-16 mx-auto mb-8 drop-shadow-2xl" />

          {error && <XCircle className="h-14 w-14 text-error mx-auto mb-4 opacity-80" />}
          {isDraft && <Clock className="h-14 w-14 text-zinc-500 mx-auto mb-4 opacity-80" />}
          {(isClosed || isTied) && <div className="h-1 w-12 bg-primary mx-auto mb-6 rounded-full" />}

          <h2 className="text-2xl font-black tracking-tighter text-foreground mb-2 uppercase">
            {error ? "Error" : isDraft ? "Próximamente" : isTied ? "¡Empate!" : "Finalizada"}
          </h2>

          <p className=" text-sm mb-10 font-medium">
            {error || (isDraft ? "La votación aún no ha comenzado." : isTied ? "La batalla terminó en tablas." : "Esta batalla ha concluido.")}
          </p>

          <Link to={isClosed || isTied ? `/resultados/${code}` : "/"}>
            <Button className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[22px] font-black text-lg shadow-xl transition-all active:scale-95">
              {isClosed || isTied ? "VER RESULTADOS" : "VOLVER"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- PANTALLA DE IDENTIFICACIÓN ---
  if (!voterReady && !hasVoted) {
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

              <h1 className="text-3xl font-black">{battle?.title}</h1>
              <p className=" text-sm mb-10 font-medium">Completa tus datos para habilitar el voto.</p>

              <form onSubmit={(e) => { e.preventDefault(); voterName.trim() && setVoterReady(true); }} className="w-full space-y-6 text-left">
                <div className="space-y-2">
                  <label>Nombre Completo</label>
                  <div className="relative">
                    <Input
                      value={voterName}
                      onChange={e => setVoterName(e.target.value)}
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
                        onChange={e => setVoterDocument(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label>Celular</label>
                    <div className="relative">
                      <Input
                        value={voterPhone}
                        onChange={e => setVoterPhone(e.target.value)}
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

  // --- PANTALLA DE VOTACIÓN PRINCIPAL ---
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 overflow-x-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] bg-primary/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[150px] rounded-full" />
      </div>

      <Header
        leftContent={
          <div className="hidden sm:flex flex-col">
            <h2 className="text-sm font-black tracking-tighter uppercase leading-none text-foreground">{battle?.title}</h2>
            <span className="text-[10px]  font-bold tracking-widest mt-1">SISTEMA DE VOTACIÓN</span>
          </div>
        }
        rightContent={
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="block text-[9px] uppercase tracking-[0.2em]  font-black">Total Votos</span>
              <span className="text-2xl font-black tabular-nums text-primary tracking-tighter leading-none">{battle?.totalVotes || 0}</span>
            </div>
            <VoteTimer expiresAt={battle?.expiresAt} expired={expired} onExpire={() => setExpired(true)} />
          </div>
        }
        containerClassName="max-w-4xl"
      />

      {battle?.status === "tiebreaker" && (
        <div className="bg-primary text-primary-foreground py-2 overflow-hidden relative">
          <div className="flex items-center justify-center gap-4 animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[11px] font-black tracking-[0.3em] uppercase text-primary-foreground">Ronda de Desempate Activa</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
      )}

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 pt-24">
        {hasVoted && (
          <div className="animate-in fade-in slide-in-from-top-6 duration-700">
            <div className="glass-card rounded-[32px] border border-primary/20 bg-primary/[0.03] p-6 flex items-center justify-between backdrop-blur-3xl">
              <div className="flex items-center gap-4 text-left">
                <CheckCircle2 className="h-16 w-16" />
                <div>
                  <h3 className="text-lg font-black tracking-tight leading-none">Voto Registrado</h3>
                  <p className=" text-xs font-medium mt-1 uppercase tracking-wider">Puedes cambiar tu elección mientras el tiempo siga corriendo</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mt-8">
          {battle?.participants?.map((participant: Participant, idx: number) => {
            const isVotedFor = votedFor === participant.id;
            const isTiebreakerDisabled = battle.status === "tiebreaker" && battle.tiedParticipantIds && !battle.tiedParticipantIds.includes(participant.id);
            const isDisabled = voting !== null || isTiebreakerDisabled;

            return (
              <button
                key={participant.id}
                onClick={() => !isDisabled && (hasVoted ? changeVote(participant.id) : castVote(participant.id))}
                disabled={isDisabled}
                className={cn(
                  "relative w-full text-left rounded-[32px] overflow-hidden transition-all duration-500 group border",
                  "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]",
                  isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer active:scale-[0.98]",
                  isVotedFor && "border-primary/40 bg-primary/[0.05]"
                )}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Barra de progreso Líquida Premium */}
                {hasVoted && (
                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-[2000ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
                    style={{ width: `${participant.percentage}%` }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.12] transition-colors duration-1000"
                      style={{ backgroundColor: participant.color }}
                    />
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                    <div
                      className="absolute top-0 bottom-0 right-0 w-[2px] opacity-60 shadow-[0_0_20px_white]"
                      style={{ backgroundColor: participant.color }}
                    />
                  </div>
                )}

                <div className="relative p-7 sm:p-9 flex items-center justify-between gap-8 z-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-2.5 h-2.5 rounded-full shadow-lg"
                        style={{ backgroundColor: participant.color, boxShadow: `0 0 10px ${participant.color}80` }}
                      />
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase ">{participant.name}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black leading-[1.1] tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500">
                      "{participant.headline}"
                    </p>
                  </div>

                  {hasVoted ? (
                    <div className="text-right shrink-0">
                      <span className="text-4xl sm:text-5xl font-black tracking-tighter block leading-none mb-1" style={{ color: participant.color }}>
                        {participant.percentage}%
                      </span>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        {participant.votes.toLocaleString()} VOTOS
                      </span>
                    </div>
                  ) : (
                    <div className={cn(
                      "h-14 w-14 rounded-2xl border flex items-center justify-center transition-all duration-500 shrink-0",
                      isTiebreakerDisabled ? "border-white/5 /10" : "border-white/10 group-hover:bg-primary group-hover:text-primary-foreground  group-hover:rotate-12"
                    )}>
                      {voting === participant.id ? <Loader2 className="h-6 w-6 animate-spin" /> : <ChevronRight className="h-6 w-6" />}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!hasVoted && (
          <div className="mt-12 text-center animate-pulse">
            <p className=" text-xs font-black tracking-[0.3em] uppercase">Toca un titular para votar</p>
          </div>
        )}
      </main>

      {/* Footer con créditos originales */}
      <footer className="mt-auto border-t border-white/5 py-16 px-6 bg-white/[0.01]">
        <div className="max-w-3xl mx-auto text-center">
          <p className=" text-sm font-medium leading-relaxed max-w-md mx-auto mb-8">
            Un tributo a la comedia de <span className="text-foreground font-bold">F*cks News Noticreo</span>.
            Hecho con código y muchas risas.
          </p>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] uppercase tracking-[0.1em] font-black">Development by</span>
            <span className="text-sm font-black bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent uppercase tracking-wider">
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
    <div className="pl-8 border-l border-white/10 flex flex-col items-end">
      <span className="text-[9px] uppercase tracking-[0.2em]  font-black mb-1">Cierra en</span>
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4 text-destructive animate-pulse" />
        <span className="text-2xl font-black font-mono text-destructive tabular-nums tracking-tighter leading-none">
          {countdown?.isExpired || expired ? "FINAL" : countdown?.display || "00:00"}
        </span>
      </div>
    </div>
  );
}
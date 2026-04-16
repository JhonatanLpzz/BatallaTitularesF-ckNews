/**
 * @fileoverview Página pública de votación.
 * Flujo: Identificación del votante → Selección de titular → Resultados en vivo.
 * Refactorizado: formulario en {@link VoterIdentificationForm},
 * estados de error en {@link BattleStatusScreen}, timer en {@link VoteTimer}.
 * @module pages/VotePage
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { cn, generateFingerprint } from "@/lib/utils";
import { battleService, voteService } from "@/services/api";
import { BATTLE_STATUS, LIVE_STATUSES } from "@/constants";
import type { Battle, Participant, VoteUpdate, ApiError } from "@/types";
import { useSSE } from "@/hooks/useSSE";
import { Header } from "@/components/Header";
import { VoteTimer } from "@/components/VoteTimer";
import { VoterIdentificationForm } from "@/components/VoterIdentificationForm";
import { BattleStatusScreen } from "@/components/BattleStatusScreen";

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

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

  // ---- Data fetching -------------------------------------------------------

  const fetchBattle = useCallback(async () => {
    if (!code) return;
    try {
      const data = await battleService.getByCode(code);
      setBattle(data);
      const fp = generateFingerprint();
      const voteCheck = await voteService.check(code, fp);
      setHasVoted(voteCheck.hasVoted);
      setVotedFor(voteCheck.participantId ?? null);
      if (voteCheck.hasVoted) setVoterReady(true);
    } catch {
      setError("Batalla no encontrada");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { fetchBattle(); }, [fetchBattle]);

  // ---- SSE en tiempo real --------------------------------------------------

  useSSE(code, {
    enabled: !!battle && LIVE_STATUSES.includes(battle.status),
    onMessage: (data) => {
      const update = data as VoteUpdate;
      if (update.type === "vote_update" && battle) {
        setBattle((prev) => prev ? { ...prev, participants: update.participants, totalVotes: update.totalVotes } : prev);
      }
    },
  });

  // ---- Voting actions ------------------------------------------------------

  const castVote = async (participantId: number) => {
    if (!code || hasVoted || !voterReady) return;
    setVoting(participantId);
    try {
      await voteService.cast({
        battleCode: code,
        participantId,
        fingerprint: generateFingerprint(),
        voterName: voterName.trim(),
        voterDocument: voterDocument.trim() || undefined,
        voterPhone: voterPhone.trim() || undefined,
      });
      setHasVoted(true);
      setVotedFor(participantId);
      toast.success("¡Voto registrado!");
    } catch (err) {
      if ((err as ApiError).status === 409) {
        setHasVoted(true);
        return;
      }
      toast.error("No se pudo registrar el voto");
    } finally {
      setVoting(null);
    }
  };

  const changeVote = async (participantId: number) => {
    if (!code || !hasVoted || !voterReady || votedFor === participantId) return;
    setVoting(participantId);
    try {
      await voteService.change({
        battleCode: code,
        participantId,
        fingerprint: generateFingerprint(),
      });
      setVotedFor(participantId);
      toast.success("Voto actualizado");
    } catch {
      toast.error("No se pudo cambiar el voto");
    } finally {
      setVoting(null);
    }
  };

  // ---- Voter identification handler ----------------------------------------

  const handleVoterSubmit = (data: { name: string; document: string; phone: string }) => {
    setVoterName(data.name);
    setVoterDocument(data.document);
    setVoterPhone(data.phone);
    setVoterReady(true);
  };

  // ---- Loading state -------------------------------------------------------

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 border-t-2 rounded-full animate-spin opacity-20" />
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </div>
  );

  // ---- Error / Draft / Closed / Tied states --------------------------------

  if (error || !battle || battle.status === BATTLE_STATUS.DRAFT || battle.status === BATTLE_STATUS.CLOSED || battle.status === BATTLE_STATUS.TIED) {
    return <BattleStatusScreen code={code || ""} battle={battle} error={error} />;
  }

  // ---- Voter identification form -------------------------------------------

  if (!voterReady && !hasVoted) {
    return (
      <VoterIdentificationForm
        battleTitle={battle?.title || ""}
        onSubmit={handleVoterSubmit}
      />
    );
  }

  // ---- Main voting screen --------------------------------------------------

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 overflow-x-hidden pt-6">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] bg-primary/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[150px] rounded-full" />
      </div>

      <Header
        leftContent={
          <div className="hidden sm:flex flex-col">
            <h2 className="text-sm font-black tracking-tighter uppercase leading-none text-foreground">{battle?.title}</h2>
            <span className="text-[10px] tracking-widest mt-1">SISTEMA DE VOTACIÓN</span>
          </div>
        }
        rightContent={
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-[9px] uppercase">Total Votos</span>
              <span className="text-2xl font-black font-mono text-destructive tabular-nums tracking-tighter leading-none">
                {battle?.totalVotes || 0}</span>
            </div>
            <VoteTimer expiresAt={battle?.expiresAt} expired={expired} onExpire={() => setExpired(true)} />
          </div>
        }
        containerClassName="max-w-4xl"
      />

      {battle?.status === BATTLE_STATUS.TIEBREAKER && (
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
            <div className="glass-card rounded-[32px] border border-green-300 dark:border-green-600 bg-green-500 bg-opacity-15 p-6 flex items-center justify-between backdrop-blur-3xl">
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
            const isTiebreakerDisabled = battle.status === BATTLE_STATUS.TIEBREAKER && battle.tiedParticipantIds && !battle.tiedParticipantIds.includes(participant.id);
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
                    className="absolute inset-y-0 left-0 transition-all duration-&lsqb;2000ms&rsqb; ease-&lsqb;cubic-bezier(0.16,1,0.3,1)&rsqb; overflow-hidden"
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
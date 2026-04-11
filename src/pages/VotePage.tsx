import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Clock, User, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, generateFingerprint } from "@/lib/utils";
import type { Battle, Participant, VoteUpdate } from "@/types";
import { useSSE } from "@/hooks/useSSE";
import { useCountdown } from "@/hooks/useCountdown";

export default function VotePage() {
  const { code } = useParams<{ code: string }>();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Voter info
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

  useEffect(() => {
    fetchBattle();
  }, [fetchBattle]);

  useSSE(code, {
    enabled: !!battle && battle.status === "active",
    onMessage: (data) => {
      const update = data as VoteUpdate;
      if (update.type === "vote_update" && battle) {
        setBattle((prev) =>
          prev
            ? { ...prev, participants: update.participants, totalVotes: update.totalVotes }
            : prev
        );
      }
    },
  });

  const handleVoterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterName.trim()) {
      toast.error("Tu nombre es obligatorio");
      return;
    }
    setVoterReady(true);
  };

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

      if (res.status === 409) {
        setHasVoted(true);
        toast.info("Ya votaste en esta batalla");
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setHasVoted(true);
      setVotedFor(participantId);
      toast.success("Voto registrado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al votar");
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-fn-red mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-2">{error || "Error"}</h2>
          <Link to="/">
            <Button variant="outline" size="sm">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (battle.status === "draft") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-1">Aun no comienza</h2>
          <p className="text-sm text-muted-foreground">La votacion se activara pronto...</p>
        </div>
      </div>
    );
  }

  if (battle.status === "closed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <img src="/logo_fn.png" alt="F*cks News" className="h-14 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-1">Batalla Cerrada</h2>
          <p className="text-sm text-muted-foreground mb-4">La votacion ha terminado</p>
          <Link to={`/resultados/${code}`}>
            <Button size="sm">Ver Resultados</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Voter identification form
  if (!voterReady && !hasVoted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="fn-accent-bar w-full" />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <img src="/logo_fn.png" alt="F*cks News" className="h-16 mx-auto mb-4" />
              <h1 className="text-lg font-semibold">{battle.title}</h1>
              {battle.description && (
                <p className="text-sm text-muted-foreground mt-1">{battle.description}</p>
              )}
            </div>

            <form onSubmit={handleVoterSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Tu nombre <span className="text-fn-red">*</span>
                </label>
                <Input
                  placeholder="Nombre completo"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Documento <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Input
                  placeholder="Cedula o documento"
                  value={voterDocument}
                  onChange={(e) => setVoterDocument(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Celular <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Input
                  placeholder="Numero de celular"
                  value={voterPhone}
                  onChange={(e) => setVoterPhone(e.target.value)}
                  type="tel"
                />
              </div>
              <Button type="submit" className="w-full">
                <User className="h-4 w-4 mr-2" />
                Continuar a Votar
              </Button>
            </form>

            <p className="text-center text-[11px] text-muted-foreground mt-4">
              Solo tu nombre es obligatorio para votar
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fn-accent-bar w-full" />

      {/* Header */}
      <VoteHeader battle={battle} expired={expired} onExpire={() => setExpired(true)} />

      {/* Voting area */}
      <div className="max-w-lg mx-auto px-4 py-6 flex-1 w-full">
        {hasVoted && (
          <div className="mb-5 p-3 rounded-md bg-green-50 border border-green-200 text-center">
            <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-green-700">Voto registrado</p>
            <p className="text-xs text-green-600 mt-0.5">Los resultados se actualizan en tiempo real</p>
          </div>
        )}

        <div className="space-y-3">
          {battle.participants?.map((participant: Participant, idx: number) => {
            const isVotedFor = votedFor === participant.id;

            return (
              <button
                key={participant.id}
                onClick={() => !hasVoted && castVote(participant.id)}
                disabled={hasVoted || voting !== null}
                className={cn(
                  "w-full text-left rounded-md border p-4 transition-all relative overflow-hidden",
                  hasVoted
                    ? "cursor-default"
                    : "cursor-pointer hover:border-primary active:scale-[0.99]",
                  isVotedFor
                    ? "border-green-500 bg-green-50"
                    : "border-border bg-white"
                )}
              >
                {/* Progress bar */}
                {hasVoted && (
                  <div
                    className="absolute inset-y-0 left-0 opacity-10 transition-all duration-1000"
                    style={{
                      backgroundColor: participant.color,
                      width: `${participant.percentage}%`,
                    }}
                  />
                )}

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: participant.color }}
                        />
                        <span className="font-medium text-sm">{participant.name}</span>
                      </div>
                      <p className="text-sm leading-snug text-foreground">
                        "{participant.headline}"
                      </p>
                    </div>

                    {hasVoted && (
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold" style={{ color: participant.color }}>
                          {participant.percentage}%
                        </div>
                        <div className="text-[11px] text-muted-foreground">{participant.votes} votos</div>
                      </div>
                    )}
                  </div>

                  {voting === participant.id && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary mt-2" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!hasVoted && (
          <p className="text-center text-xs text-muted-foreground mt-5">
            Toca el titular que mas te guste para votar
          </p>
        )}
      </div>

      {/* Fan message */}
      <div className="border-t bg-white px-4 py-5 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
          Gracias a <strong className="text-primary">F*cks News Noticreo</strong> por esa comedia acida
          y bien pensada. Son el apoyo y la risa de mucha gente.
          Esperamos verlos pronto en tarima — la ultima vez no alcanzamos a comprar boletas!
        </p>
        <p className="text-[10px] text-muted-foreground mt-2">
          Desarrollado con cariño por <strong>Jhonatan Lopez Conde</strong> — Bogota, Colombia
        </p>
      </div>
    </div>
  );
}

function VoteHeader({ battle, expired, onExpire }: { battle: Battle; expired: boolean; onExpire: () => void }) {
  const countdown = useCountdown(battle.expiresAt);

  if (countdown?.isExpired && !expired) {
    onExpire();
  }

  return (
    <div className="text-center pt-6 pb-4 px-4 border-b bg-white">
      <img src="/logo_fn.png" alt="F*cks News" className="h-10 mx-auto mb-3" />
      <h1 className="text-lg font-semibold mb-0.5">{battle.title}</h1>
      {battle.description && (
        <p className="text-xs text-muted-foreground">{battle.description}</p>
      )}
      <div className="flex items-center justify-center gap-3 mt-1">
        <p className="text-xs text-muted-foreground">
          {battle.totalVotes || 0} votos
        </p>
        {countdown && !countdown.isExpired && (
          <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-fn-red">
            <Timer className="h-3 w-3" />
            {countdown.display}
          </span>
        )}
        {countdown?.isExpired && (
          <span className="text-xs font-medium text-fn-red">Tiempo agotado</span>
        )}
      </div>
    </div>
  );
}

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
      <div className="min-h-screen bg-vote-gradient flex flex-col relative overflow-hidden">
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-campaign-gold/5 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="campaign-accent-bar w-full h-1" />
        
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md campaign-card p-8 animate-fade-in-up">
            <div className="text-center mb-8">
              <img src="/logo_fn.png" alt="F*cks News" className="h-20 mx-auto mb-6 drop-shadow-lg" />
              <h1 className="text-2xl font-bold text-white mb-2">{battle.title}</h1>
              {battle.description && (
                <p className="text-muted-foreground">{battle.description}</p>
              )}
            </div>

            <form onSubmit={handleVoterSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-semibold block mb-2 text-foreground">
                  Tu nombre <span className="text-campaign-red">*</span>
                </label>
                <Input
                  placeholder="Nombre completo"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  autoFocus
                  required
                  className="h-12 text-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2 text-foreground/80">
                  Documento <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Input
                  placeholder="Cédula o documento"
                  value={voterDocument}
                  onChange={(e) => setVoterDocument(e.target.value)}
                  className="h-12"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2 text-foreground/80">
                  Celular <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Input
                  placeholder="Número de celular"
                  value={voterPhone}
                  onChange={(e) => setVoterPhone(e.target.value)}
                  type="tel"
                  className="h-12"
                />
              </div>
              <Button type="submit" className="w-full h-12 campaign-button text-base font-semibold">
                <User className="h-5 w-5 mr-3" />
                Continuar a Votar
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Solo tu nombre es obligatorio para participar
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vote-gradient flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-campaign-gold/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-campaign-red/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>
      
      <div className="campaign-accent-bar w-full h-1" />

      {/* Header */}
      <VoteHeader battle={battle} expired={expired} onExpire={() => setExpired(true)} />

      {/* Voting area */}
      <div className="max-w-2xl mx-auto px-6 py-8 flex-1 w-full">
        {hasVoted && (
          <div className="mb-8 campaign-card p-6 text-center border border-campaign-gold/30">
            <CheckCircle2 className="h-10 w-10 text-campaign-gold mx-auto mb-3" />
            <p className="text-lg font-semibold text-white mb-1">¡Voto Registrado!</p>
            <p className="text-muted-foreground">Los resultados se actualizan en tiempo real</p>
          </div>
        )}

        <div className="space-y-4">
          {battle.participants?.map((participant: Participant, idx: number) => {
            const isVotedFor = votedFor === participant.id;

            return (
              <div
                key={participant.id}
                className={cn(
                  "voting-card p-6 relative group animate-fade-in-up",
                  isVotedFor && "battle-winner"
                )}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <button
                  onClick={() => !hasVoted && castVote(participant.id)}
                  disabled={hasVoted || voting !== null}
                  className="w-full text-left"
                >
                  {/* Progress bar */}
                  {hasVoted && (
                    <div
                      className="absolute inset-y-0 left-0 opacity-20 transition-all duration-1000 rounded-l-lg"
                      style={{
                        backgroundColor: participant.color,
                        width: `${participant.percentage}%`,
                      }}
                    />
                  )}

                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-4 h-4 rounded-full shrink-0 shadow-glow"
                            style={{ backgroundColor: participant.color }}
                          />
                          <span className="font-bold text-base text-white">{participant.name}</span>
                        </div>
                        <p className="text-base md:text-lg text-foreground/90 leading-relaxed font-medium">
                          "{participant.headline}"
                        </p>
                      </div>

                      {hasVoted && (
                        <div className="text-right shrink-0">
                          <div 
                            className="text-3xl font-bold mb-1"
                            style={{ color: participant.color }}
                          >
                            {participant.percentage}%
                          </div>
                          <div className="text-xs text-muted-foreground">{participant.votes} votos</div>
                        </div>
                      )}
                    </div>

                    {voting === participant.id && (
                      <div className="flex items-center justify-center mt-4">
                        <Loader2 className="h-6 w-6 animate-spin text-campaign-gold" />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {!hasVoted && (
          <p className="text-center text-sm text-muted-foreground mt-8 font-medium">
            Selecciona el titular que más te guste para votar
          </p>
        )}
      </div>

      {/* Fan message */}
      <div className="border-t border-border/30 campaign-card px-6 py-8 text-center">
        <p className="text-sm text-foreground/70 leading-relaxed max-w-2xl mx-auto mb-4">
          Gracias a <strong className="campaign-gold-gradient">F*cks News Noticreo</strong> por esa comedia ácida
          y bien pensada. Son el apoyo y la risa de mucha gente.
          ¡Esperamos verlos pronto en tarima — la última vez no alcanzamos a comprar boletas!
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Desarrollado con ❤️ por <strong className="text-campaign-gold">Jhonatan Lopez Conde</strong></span>
          <span>•</span>
          <span>Bogotá, Colombia</span>
        </div>
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
    <div className="campaign-card border-b border-border/30 text-center pt-8 pb-6 px-6">
      <img src="/logo_fn.png" alt="F*cks News" className="h-14 mx-auto mb-6 drop-shadow-lg" />
      <h1 className="text-2xl font-bold text-white mb-2">{battle.title}</h1>
      {battle.description && (
        <p className="text-muted-foreground mb-4">{battle.description}</p>
      )}
      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-xl font-bold text-campaign-gold">{battle.totalVotes || 0}</p>
        </div>
        {countdown && !countdown.isExpired && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Tiempo</p>
            <div className="inline-flex items-center gap-2">
              <Timer className="h-4 w-4 text-campaign-red" />
              <span className="text-xl font-bold font-mono text-campaign-red">
                {countdown.display}
              </span>
            </div>
          </div>
        )}
        {countdown?.isExpired && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Estado</p>
            <span className="text-lg font-bold text-campaign-red">FINALIZADA</span>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Users, Crown, ArrowLeft, Timer, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Battle, Participant, VoteUpdate } from "@/types";
import { useSSE } from "@/hooks/useSSE";
import { useCountdown } from "@/hooks/useCountdown";

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBattle = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/battles/${code}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBattle(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchBattle();
  }, [fetchBattle]);

  useSSE(code, {
    enabled: !!battle,
    onMessage: (data) => {
      const update = data as VoteUpdate;
      if (update.type === "vote_update" && battle) {
        setBattle((prev) =>
          prev ? { ...prev, participants: update.participants, totalVotes: update.totalVotes } : prev
        );
      }
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Batalla no encontrada</p>
          <Link to="/">
            <Button variant="outline" size="sm">Volver</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sorted = [...(battle.participants || [])].sort((a, b) => b.votes - a.votes);
  const maxVotes = sorted.length > 0 ? sorted[0].votes : 0;

  return (
    <div className="min-h-screen bg-vote-gradient flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-campaign-gold/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-campaign-red/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="campaign-accent-bar w-full h-1" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 campaign-card border-b border-border/30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-foreground hover:text-campaign-gold">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <img src="/logo_fn.png" alt="F*cks News" className="h-10 drop-shadow-lg" />
            <div>
              <h1 className="text-lg font-bold campaign-gold-gradient">RESULTADOS EN VIVO</h1>
              <p className="text-xs text-muted-foreground">Batalla de Titulares</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-sm border-campaign-gold/30 text-campaign-gold">
              <Users className="h-3 w-3 mr-1" />
              {battle.totalVotes || 0} votos
            </Badge>
            {battle.status === "active" && (
              <Badge variant="success" className="text-xs animate-pulse">EN VIVO</Badge>
            )}
            <CountdownBadge expiresAt={battle.expiresAt} />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">
        {/* Title */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="campaign-gold-gradient animate-glow-pulse">{battle.title}</span>
          </h1>
          {battle.description && (
            <p className="text-foreground/80 text-lg">{battle.description}</p>
          )}
          <div className="w-24 h-1 bg-gold-gradient mx-auto mt-6 rounded-full" />
        </div>

        {/* Results */}
        <div className="space-y-6">
          {sorted.map((participant: Participant, idx: number) => {
            const isWinner = idx === 0 && participant.votes > 0;
            const barWidth = maxVotes > 0 ? (participant.votes / maxVotes) * 100 : 0;

            return (
              <div
                key={participant.id}
                className={cn(
                  "campaign-card p-8 transition-all animate-fade-in-up",
                  isWinner && "battle-winner shadow-glow"
                )}
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                <div className="flex items-center gap-6">
                  {/* Position */}
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0",
                      isWinner
                        ? "bg-campaign-gradient text-campaign-gold shadow-glow"
                        : "bg-muted/20 text-muted-foreground"
                    )}
                  >
                    {isWinner ? <Crown className="h-8 w-8" /> : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name and percentage */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-glow"
                          style={{ backgroundColor: participant.color }}
                        />
                        <span className="font-bold text-xl text-white">{participant.name}</span>
                        {isWinner && (
                          <span className="text-sm font-bold text-campaign-gold bg-campaign-gold/10 px-3 py-1 rounded-full">
                            CAMPEÓN
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground font-medium">
                          {participant.votes} votos
                        </span>
                        <span
                          className="text-4xl font-bold"
                          style={{ color: participant.color }}
                        >
                          {participant.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    <p className="text-base text-foreground/80 mb-4 font-medium leading-relaxed">
                      "{participant.headline}"
                    </p>

                    {/* Progress bar */}
                    <div className="h-4 rounded-full bg-muted/20 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1500 ease-out shadow-glow"
                        style={{
                          backgroundColor: participant.color,
                          width: `${barWidth}%`,
                          boxShadow: `0 0 20px ${participant.color}40`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {(!battle.participants || battle.participants.length === 0) && (
          <div className="campaign-card p-12 text-center">
            <Swords className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No hay participantes</p>
          </div>
        )}
      </main>

      {/* Fan message + Footer */}
      <footer className="border-t border-border/30 campaign-card px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
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
      </footer>
    </div>
  );
}

function CountdownBadge({ expiresAt }: { expiresAt?: string | null }) {
  const countdown = useCountdown(expiresAt);
  if (!countdown) return null;

  if (countdown.isExpired) {
    return <Badge variant="destructive" className="text-[10px]">FINALIZADA</Badge>;
  }

  return (
    <Badge variant="outline" className="font-mono text-xs text-fn-red border-fn-red/30">
      <Timer className="h-3 w-3 mr-1" />
      {countdown.display}
    </Badge>
  );
}

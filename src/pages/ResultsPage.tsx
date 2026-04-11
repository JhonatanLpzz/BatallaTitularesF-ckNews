import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Users, Crown, ArrowLeft, Timer } from "lucide-react";
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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fn-accent-bar w-full" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <img src="/logo_fn.png" alt="F*cks News" className="h-8" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              <Users className="h-3 w-3 mr-1" />
              {battle.totalVotes || 0} votos
            </Badge>
            {battle.status === "active" && (
              <Badge variant="success" className="text-[10px]">EN VIVO</Badge>
            )}
            <CountdownBadge expiresAt={battle.expiresAt} />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 w-full flex-1">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{battle.title}</h1>
          {battle.description && (
            <p className="text-muted-foreground text-sm mt-1">{battle.description}</p>
          )}
        </div>

        {/* Results */}
        <div className="space-y-3">
          {sorted.map((participant: Participant, idx: number) => {
            const isWinner = idx === 0 && participant.votes > 0;
            const barWidth = maxVotes > 0 ? (participant.votes / maxVotes) * 100 : 0;

            return (
              <div
                key={participant.id}
                className={cn(
                  "border rounded-md p-4 bg-white transition-all",
                  isWinner && "battle-winner"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Position */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                      isWinner
                        ? "bg-fn-red text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isWinner ? <Crown className="h-4 w-4" /> : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name and percentage */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: participant.color }}
                        />
                        <span className="font-medium text-sm">{participant.name}</span>
                        {isWinner && (
                          <span className="text-[10px] font-semibold text-fn-red uppercase">Ganador</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {participant.votes} votos
                        </span>
                        <span
                          className="text-lg font-bold"
                          style={{ color: participant.color }}
                        >
                          {participant.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    <p className="text-xs text-muted-foreground mb-2">
                      "{participant.headline}"
                    </p>

                    {/* Progress bar */}
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          backgroundColor: participant.color,
                          width: `${barWidth}%`,
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
          <div className="text-center py-20">
            <p className="text-muted-foreground">No hay participantes</p>
          </div>
        )}
      </main>

      {/* Fan message + Footer */}
      <footer className="border-t bg-white px-4 py-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            Gracias a <strong className="text-primary">F*cks News Noticreo</strong> por esa comedia acida
            y bien pensada. Son el apoyo y la risa de mucha gente.
            Esperamos verlos pronto en tarima — la ultima vez no alcanzamos a comprar boletas!
          </p>
          <p className="text-[10px] text-muted-foreground mt-3">
            Desarrollado con cariño por <strong>Jhonatan Lopez Conde</strong> — Bogota, Colombia
          </p>
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

import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Crown, Timer, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Battle, Participant, VoteUpdate } from "@/types";
import { useSSE } from "@/hooks/useSSE";
import { useCountdown } from "@/hooks/useCountdown";
import { Header } from "@/components/Header";

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
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 border-t-2 rounded-full animate-spin opacity-20" />
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="glass-card rounded-[32px] p-8 text-center max-w-sm w-full">
          <p className="text-muted-foreground mb-4">Batalla no encontrada</p>
          <Link to="/">
            <Button className="bg-white/10 hover:bg-white/20 text-foreground rounded-xl mt-4">Volver</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sorted = [...(battle.participants || [])].sort((a, b) => b.votes - a.votes);
  const maxVotes = sorted.length > 0 ? sorted[0].votes : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[30%] -right-[20%] w-[50%] h-[50%] blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-campaign-blue/5 blur-[120px] rounded-full" />
      </div>

      <Header
        leftContent={
          <div className="hidden sm:block min-w-0">
            <h1 className="font-bold truncate text-lg">RESULTADOS</h1>
            <p className="text-muted-foreground text-xs">Batalla de Titulares</p>
          </div>
        }
        rightContent={
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <span className="block text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Total Votos</span>
              <span className="text-lg font-semibold tabular-nums text-primary tracking-tight">{battle.totalVotes || 0}</span>
            </div>
            {battle.status === "active" && (
              <Badge className="bg-status-success/20 text-status-success border-status-success/30 text-[10px] sm:text-xs animate-pulse px-2 rounded-lg">VIVO</Badge>
            )}
            {battle.status === "tied" && (
              <Badge className="bg-status-warning/20 text-status-warning border-status-warning/30 text-[10px] sm:text-xs px-2 rounded-lg">EMPATE</Badge>
            )}
            {battle.status === "tiebreaker" && (
              <Badge className="bg-status-warning/20 text-status-warning border-status-warning/30 text-[10px] sm:text-xs animate-pulse px-2 rounded-lg">DESEMPATE</Badge>
            )}
            <CountdownBadge expiresAt={battle.expiresAt} />
          </div>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1">
        {/* Mobile-Optimized Title */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in-up mt-8 md:mt-12">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight mb-2 sm:mb-4 px-2">
            <span className="animate-glow-pulse leading-tight">{battle.title}</span>
          </h1>
          {battle.description && (
            <p className="text-muted-foreground text-sm sm:text-lg px-4 leading-relaxed font-medium">{battle.description}</p>
          )}
          <div className="w-16 sm:w-24 h-1 bg-gradient-to-r mx-auto mt-4 sm:mt-6 rounded-full opacity-50" />
        </div>

        {/* Tie / Tiebreaker Banner */}
        {(battle.status === "tied" || battle.status === "tiebreaker") && (
          <div className={`glass-card rounded-[24px] p-6 mb-8 border text-center ${battle.status === "tied"
              ? "border-status-warning/40 bg-status-warning/5"
              : "border-status-warning/50 bg-status-warning/5"
            }`}>
            <p className={`font-semibold text-sm ${battle.status === "tied" ? "text-status-warning" : "text-status-warning"
              }`}>
              {battle.status === "tied"
                ? "La batalla terminó en empate. El administrador puede iniciar una ronda de desempate."
                : `Ronda de desempate${battle.tiebreakRound ? ` #${battle.tiebreakRound}` : ""} en curso.`}
            </p>
          </div>
        )}

        {/* Liquid Glass Results */}
        <div className="space-y-4 sm:space-y-6">
          {sorted.map((participant: Participant, idx: number) => {
            const isWinner = idx === 0 && participant.votes > 0 && battle.status === "closed";
            const barWidth = maxVotes > 0 ? (participant.votes / maxVotes) * 100 : 0;

            return (
              <div
                key={participant.id}
                className={cn(
                  "glass-card rounded-[28px] overflow-hidden transition-all duration-500 animate-fade-in-up",
                  isWinner && "border-campaign-gold/40 bg-campaign-gold/[0.02]"
                )}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
                  {/* Layer Liquid Progress Bar */}
                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] z-0"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: participant.color,
                      opacity: 0.15,
                    }}
                  />

                  {/* Header Row - Position + Name + Percentage */}
                  <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 z-10 w-full sm:w-auto">
                    {/* Position Icon/Number */}
                    <div
                      className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl shrink-0 backdrop-blur-md border border-white/10",
                        isWinner
                          ? "bg-primary/20 text-primary shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                          : "bg-white/5 text-muted-foreground"
                      )}
                    >
                      {isWinner ? <Crown className="h-6 w-6 sm:h-8 sm:w-8" /> : idx + 1}
                    </div>

                    {/* Name + Champion Badge (Mobile) */}
                    <div className="flex items-center gap-3 flex-1 min-w-0 sm:hidden">
                      <div
                        className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] shrink-0"
                        style={{ backgroundColor: participant.color }}
                      />
                      <span className="font-bold text-lg text-foreground truncate tracking-tight">{participant.name}</span>
                      {isWinner && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full whitespace-nowrap">
                          CAMPEÓN
                        </span>
                      )}
                    </div>

                    {/* Percentage (Mobile) */}
                    <div className="flex flex-col items-end sm:hidden shrink-0">
                      <span
                        className="text-2xl font-bold leading-none tracking-tighter"
                        style={{ color: participant.color }}
                      >
                        {participant.percentage}%
                      </span>
                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-tighter mt-1">
                        {participant.votes} votos
                      </span>
                    </div>
                  </div>

                  {/* Desktop Layout Content */}
                  <div className="flex-1 min-w-0 hidden sm:flex flex-col justify-center z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                          style={{ backgroundColor: participant.color }}
                        />
                        <span className="font-bold text-xl text-foreground tracking-tight">{participant.name}</span>
                        {isWinner && (
                          <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                            CAMPEÓN
                          </span>
                        )}
                      </div>
                      <div className="flex items-end gap-4">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-tighter pb-1">
                          {participant.votes} votos
                        </span>
                        <span
                          className="text-4xl font-bold tracking-tighter leading-none"
                          style={{ color: participant.color }}
                        >
                          {participant.percentage}%
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground font-medium leading-snug">
                      "{participant.headline}"
                    </p>
                  </div>
                </div>

                {/* Headline - Full Width (Mobile only) */}
                <div className="px-6 pb-6 sm:hidden relative z-10">
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    "{participant.headline}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {(!battle.participants || battle.participants.length === 0) && (
          <div className="glass-card rounded-[32px] p-12 text-center mt-8">
            <Swords className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground font-medium">No hay participantes en esta batalla</p>
          </div>
        )}
      </main>

      {/* Footer minimalista Apple Style */}
      <footer className="mt-auto border-t border-white/[0.06] py-12 px-6 bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto">
            Un tributo a la comedia de <span className="text-zinc-300 font-medium">F*cks News Noticreo</span>.
            Gracias por el apoyo y las risas constantes.
          </p>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Desarrollado por</span>
            <span className="text-sm font-medium bg-gradient-to-r to-yellow-200 bg-clip-text text-transparent">
              Jhonatan Lopez Conde
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CountdownBadge({ expiresAt }: { expiresAt?: string | null }) {
  const countdown = useCountdown(expiresAt || "");
  if (!countdown || !expiresAt) return null;

  if (countdown.isExpired) {
    return <Badge variant="destructive" className="text-[10px] px-2 rounded-lg">FINALIZADA</Badge>;
  }

  return (
    <div className="pl-4 sm:pl-6 border-l border-white/10 flex flex-col items-end">
      <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-0.5">Cierre en</span>
      <div className="flex items-center gap-1 sm:gap-2">
        <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-campaign-red" />
        <span className="text-base sm:text-lg font-mono font-bold text-campaign-red tabular-nums tracking-tighter drop-shadow-sm">
          <span className="hidden sm:inline">{countdown.display}</span>
          <span className="sm:hidden">{countdown.display.split(':')[0]}:{countdown.display.split(':')[1]}</span>
        </span>
      </div>
    </div>
  );
}
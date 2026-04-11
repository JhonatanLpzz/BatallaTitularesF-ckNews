import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2, Users, Crown, Timer, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Battle, Participant, VoteUpdate } from "@/types";
import { useSSE } from "@/hooks/useSSE";
import { useCountdown } from "@/hooks/useCountdown";

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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


      <nav
        className={cn(
          "fixed top-1 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          scrolled
            ? "px-2 sm:px-4 py-2"
            : "px-0 py-0"
        )}
      >
        <div
          className={cn(
            "mx-auto transition-all duration-300 ease-in-out flex items-center justify-between campaign-card border-b border-border/30",
            scrolled
              ? "max-w-4xl h-14 rounded-full shadow-lg border px-4 sm:px-6 bg-card/60 backdrop-blur-sm"
              : "max-w-6xl h-16 rounded-none border-x-0 border-t-0 px-6 bg-card/60 backdrop-blur-sm"
          )}
        >
          <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
            <Link to="/" className="shrink-0">
              <img
                src="/logo_fn.png"
                alt="F*cks News"
                className={cn(
                  "drop-shadow-lg transition-all duration-300 hover:scale-105",
                  scrolled ? "h-8" : "h-10 sm:h-12"
                )}
              />
            </Link>
            <div className={cn("transition-all duration-300 min-w-0", scrolled ? "hidden sm:block" : "block")}>
              <h1 className={cn(
                "font-bold campaign-gold-gradient truncate transition-all duration-300",
                scrolled ? "text-base" : "text-lg"
              )}>RESULTADOS</h1>
              <p className={cn(
                "text-muted-foreground transition-all duration-300",
                scrolled ? "text-[10px]" : "text-xs"
              )}>Batalla de Titulares</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <Badge variant="outline" className="font-mono text-[10px] sm:text-sm border-campaign-gold/30 text-campaign-gold px-2 py-1">
              <Users className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">votos</span>
              <span className="sm:hidden">{battle.totalVotes || 0}</span>
              <span className="hidden sm:inline">{battle.totalVotes || 0}</span>
            </Badge>
            {battle.status === "active" && (
              <Badge variant="success" className="text-[10px] sm:text-xs animate-pulse px-2">VIVO</Badge>
            )}
            <CountdownBadge expiresAt={battle.expiresAt} />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1">
        {/* Mobile-Optimized Title */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in-up mt-16 md:mt-13">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight mb-2 sm:mb-4 px-2">
            <span className="campaign-gold-gradient animate-glow-pulse leading-tight">{battle.title}</span>
          </h1>
          {battle.description && (
            <p className="text-foreground/80 text-sm sm:text-lg px-4 leading-relaxed">{battle.description}</p>
          )}
          <div className="w-16 sm:w-24 h-1 bg-gold-gradient mx-auto mt-4 sm:mt-6 rounded-full" />
        </div>

        {/* Mobile-Optimized Results */}
        <div className="space-y-4 sm:space-y-6">
          {sorted.map((participant: Participant, idx: number) => {
            const isWinner = idx === 0 && participant.votes > 0;
            const barWidth = maxVotes > 0 ? (participant.votes / maxVotes) * 100 : 0;

            return (
              <div
                key={participant.id}
                className={cn(
                  "campaign-card p-4 sm:p-8 transition-all animate-fade-in-up",
                  isWinner && "battle-winner shadow-glow"
                )}
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                {/* Mobile Layout: Stack on mobile, side-by-side on desktop */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">

                  {/* Header Row - Position + Name + Percentage */}
                  <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6">
                    {/* Position Icon/Number */}
                    <div
                      className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl shrink-0",
                        isWinner
                          ? "bg-campaign-gradient text-campaign-gold shadow-glow"
                          : "bg-muted/20 text-muted-foreground"
                      )}
                    >
                      {isWinner ? <Crown className="h-6 w-6 sm:h-8 sm:w-8" /> : idx + 1}
                    </div>

                    {/* Name + Champion Badge (Mobile) */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 sm:hidden">
                      <div
                        className="w-3 h-3 rounded-full shadow-glow"
                        style={{ backgroundColor: participant.color }}
                      />
                      <span className="font-bold text-lg text-white truncate">{participant.name}</span>
                      {isWinner && (
                        <span className="text-[10px] font-bold text-campaign-gold bg-campaign-gold/10 px-2 py-1 rounded-full whitespace-nowrap">
                          CAMPEÓN
                        </span>
                      )}
                    </div>

                    {/* Percentage (Mobile) */}
                    <div className="flex flex-col items-end sm:hidden">
                      <span
                        className="text-2xl font-bold leading-none"
                        style={{ color: participant.color }}
                      >
                        {participant.percentage}%
                      </span>
                      <span className="text-xs text-muted-foreground font-medium mt-1">
                        {participant.votes} votos
                      </span>
                    </div>
                  </div>

                  {/* Desktop Layout Content */}
                  <div className="flex-1 min-w-0 hidden sm:block">
                    {/* Name and percentage - Desktop */}
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
                  </div>
                </div>

                {/* Headline - Full Width */}
                <div className="mt-3 sm:mt-0 sm:ml-20">
                  <p className="text-sm sm:text-base text-foreground/80 mb-3 sm:mb-4 font-medium leading-relaxed">
                    "{participant.headline}"
                  </p>

                  {/* Progress bar */}
                  <div className="h-3 sm:h-4 rounded-full bg-muted/20 overflow-hidden">
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

      {/* Mobile-Optimized Footer */}
      <footer className="border-t border-border/30 campaign-card px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed max-w-2xl mx-auto mb-3 sm:mb-4 px-2">
            Gracias a <strong className="campaign-gold-gradient">F*cks News Noticreo</strong> por esa comedia ácida
            y bien pensada. Son el apoyo y la risa de mucha gente.
            ¡Esperamos verlos pronto en tarima — la última vez no alcanzamos a comprar boletas!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
            <span>Desarrollado con ❤️ por <strong className="text-campaign-gold">Jhonatan Lopez Conde</strong></span>
            <span className="hidden sm:inline">•</span>
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
    return <Badge variant="destructive" className="text-[10px] px-2">FINALIZADA</Badge>;
  }

  return (
    <Badge variant="outline" className="font-mono text-[10px] sm:text-xs text-fn-red border-fn-red/30 px-2">
      <Timer className="h-3 w-3 mr-1" />
      <span className="hidden sm:inline">{countdown.display}</span>
      <span className="sm:hidden">{countdown.display.split(':')[0]}m</span>
    </Badge>
  );
}

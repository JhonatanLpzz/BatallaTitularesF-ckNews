import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Medal, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { rankingService } from "@/services/api";
import type { GlobalRankingEntry } from "@/types";

export default function RankingPage() {
  const [entries, setEntries] = useState<GlobalRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rankingService
      .global()
      .then((res) => setEntries(res.ranking))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Ranking Global</h1>
            <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest">
              Participantes más votados de toda la plataforma
            </p>
          </div>

          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="glass-card p-8 text-center text-muted-foreground">Cargando ranking...</div>
        ) : entries.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">Aún no hay datos suficientes para ranking.</div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={`${entry.participantName}-${entry.rank}`} className="glass-card p-5 border border-border/70 rounded-2xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary border border-border">
                      {entry.rank === 1 ? (
                        <Trophy className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <Medal className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">#{entry.rank}</p>
                      <p className="font-black text-lg truncate" style={{ color: entry.participantColor }}>
                        {entry.participantName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black leading-none">{entry.totalVotes}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">votos</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Battles: <span className="text-foreground font-semibold">{entry.battlesParticipated}</span></div>
                  <div className="text-right">Wins: <span className="text-foreground font-semibold">{entry.wins}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Timer, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Battle, Participant, VoteUpdate } from "@/types";
import { useSSE } from "@/hooks/useSSE";
import { useCountdown } from "@/hooks/useCountdown";
import { Header } from "@/components/Header";
import { battleService } from "@/services/api";

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBattle = useCallback(async () => {
    if (!code) return;
    try {
      const data = await battleService.getByCode(code);
      setBattle(data);
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
      if (update.type === "vote_update") {
        setBattle((prev) =>
          prev
            ? {
                ...prev,
                participants: update.participants,
                totalVotes: update.totalVotes,
              }
            : prev
        );
      }
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link to="/">
          <Button>Volver</Button>
        </Link>
      </div>
    );
  }

  const sorted = [...battle.participants].sort((a, b) => b.votes - a.votes);
  const maxVotes = sorted[0]?.votes ?? 1;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto w-full px-4 pt-3 pb-10 flex-1">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            {battle.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-2 uppercase tracking-widest">
            Resultados en tiempo real
          </p>
        </motion.div>

        {/* Total votes */}
        <div className="flex justify-center mb-10">
          <div className="glass-card px-6 py-3 rounded-xl border border-white/10 backdrop-blur-md">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">
              Total votos
            </span>
            <div className="text-2xl font-bold text-center">
              {battle.totalVotes}
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="space-y-6">
          {sorted.map((p, i) => {
            const percentage = (p.votes / maxVotes) * 100;
            const isWinner = i === 0 && battle.status === "closed";

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative rounded-2xl p-6 border backdrop-blur-md",
                  "bg-white/[0.03] border-white/10",
                  isWinner && "ring-2 ring-yellow-400/50"
                )}
              >
                {/* Progress Bar */}
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-2xl opacity-20"
                  style={{ backgroundColor: p.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8 }}
                />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between gap-4">

                  {/* Left */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-semibold text-lg">
                      {p.name}
                    </span>
                    {isWinner && (
                      <Trophy className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>

                  {/* Right */}
                  <div className="text-right">
                    <div
                      className="text-3xl font-black tracking-tighter"
                      style={{ color: p.color }}
                    >
                      {p.percentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.votes} votos
                    </div>
                  </div>
                </div>

                {/* Bottom progress */}
                <div className="mt-4 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: p.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-6">
        Jhonatan Lopez Conde — Bogotá
      </footer>
    </div>
  );
}

function CountdownBadge({ expiresAt }: { expiresAt?: string | null }) {
  const countdown = useCountdown(expiresAt || "");
  if (!countdown || !expiresAt) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Timer className="h-4 w-4" />
      <span>{countdown.display}</span>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Swords, Play, LogIn, Trophy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Battle } from "@/types";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";

const TypewriterText = ({ text, className }: { text: string; className?: string }) => {
  const letters = Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.15 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", damping: 14, stiffness: 180 },
    },
    hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  };

  return (
    <motion.span
      className={`inline-flex overflow-hidden ${className || ""}`}
      variants={container}
      initial="hidden"
      animate="visible"
      style={{ willChange: "transform, opacity" }}
    >
      {letters.map((letter, index) => (
        <motion.span variants={child} key={`${letter}-${index}`} className="inline-block">
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

function BattleStatusBadge({ status }: { status: Battle["status"] }) {
  if (status === "draft") {
    return (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-status-warning" />
        <p className="text-sm text-status-warning font-medium">EN PREPARACIÓN</p>
      </div>
    );
  }

  if (status === "active" || status === "tiebreaker") {
    return (
      <div className="flex items-center gap-2">
        <span className="relative h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success" />
        </span>
        <p className="text-sm text-status-success font-medium">EN VIVO</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground font-medium">FINALIZADA</p>
    </div>
  );
}

export default function LandingPage() {
  const [activeBattles, setActiveBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/battles/active", {
      signal: controller.signal,
      credentials: "include",
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setActiveBattles(data);
        }
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("[LandingPage] Failed to fetch battles:", err);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-visible bg-background text-foreground flex flex-col relative selection:bg-campaign-blue/30">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-campaign-blue/10 rounded-full blur-[120px] animate-breathe" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/[0.03] rounded-full blur-[120px] animate-breathe" style={{ animationDelay: "3s" }} />
      </div>

      <Header showAdminButton={true} />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center mt-6 relative z-10">
        <div className="w-full max-w-3xl mx-auto">
          <div className="animate-spring-up inline-flex items-center gap-2 px-4 py-2 rounded-full border border-campaign-blue/20 bg-campaign-blue/5 text-campaign-blue font-medium text-sm mb-8">
            <span className="relative h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-campaign-blue opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-campaign-blue" />
            </span>
            Sistema de Votación Interactivo
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter mb-6 leading-none">
            <TypewriterText text="BATALLA DE" />
            <br />
            <motion.span
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.7 }}
              className="campaign-gold-gradient block mt-2"
            >
              TITULARES
            </motion.span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            La competencia donde los titulares más <span className="text-campaign-red">absurdos</span> se enfrentan y el público decide.
          </p>

          <div className="space-y-4 w-full max-w-md mx-auto">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Batallas</p>

            {loading ? (
              <p className="text-muted-foreground text-sm">Cargando...</p>
            ) : activeBattles.length > 0 ? (
              activeBattles.map(battle => (
                <Link key={battle.id} to={`/votar/${battle.code}`} className="block group">
                  <div className="glass-card rounded-[28px] p-6 flex items-center justify-between gap-4 hover:bg-accent/50 transition">
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="font-bold text-xl truncate mb-1">{battle.title}</h3>
                      <BattleStatusBadge status={battle.status} />
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-campaign-blue text-white flex items-center justify-center">
                      <Play className="h-6 w-6 ml-1" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="glass-card rounded-[32px] p-8 text-center">
                <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">Preparando el show</h3>
                <p className="text-muted-foreground">
                  El administrador aún no ha iniciado ninguna batalla.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="https://github.com/JhonatanLpzz/BatallaTitularesF-ckNews" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-xl gap-2">
                <ExternalLink className="h-4 w-4" />
                Ver Repositorio
              </Button>
            </a>

            <Link to="/login">
              <Button variant="ghost" className="rounded-xl gap-2">
                <LogIn className="h-4 w-4" />
                Demo: <code className="text-xs bg-secondary px-1.5 py-0.5 rounded-md">demo</code> /
                <code className="text-xs bg-secondary px-1.5 py-0.5 rounded-md">demo123</code>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border backdrop-blur-lg bg-background/80 px-6 py-6 mt-auto text-center">
        <p className="text-xs text-muted-foreground mb-3">
          Gracias a <strong className="campaign-gold-gradient">F*cks News Noticreo</strong>
        </p>

        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>Jhonatan Lopez Conde</span>
          <span>•</span>
          <span>Bogotá</span>
          <span>•</span>
          <a href="https://github.com/JhonatanLpzz/BatallaTitularesF-ckNews" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
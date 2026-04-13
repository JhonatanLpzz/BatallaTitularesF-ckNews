import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Swords, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Battle } from "@/types";
import { Header } from "@/components/Header";

export default function LandingPage() {
  const [activeBattles, setActiveBattles] = useState<Battle[]>([]);

  useEffect(() => {
    fetch("/api/battles")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setActiveBattles(data.filter(b => b.status === "active" || b.status === "tiebreaker"));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const checkModals = () => {
      const hasOpenModal = !!document.querySelector('[role="dialog"]');
      document.body.style.overflow = hasOpenModal ? 'hidden' : '';
    };

    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { childList: true, subtree: true });
    
    checkModals();
    
    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden selection:bg-campaign-gold/30">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-campaign-gold/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-campaign-red/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <Header showAdminButton={true} />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center mt-20 relative z-10">
        <div className="animate-fade-in-up w-full max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-campaign-gold/20 bg-campaign-gold/5 text-campaign-gold font-medium text-sm sm:text-base mb-8 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-campaign-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-campaign-gold"></span>
            </span>
            Sistema de Votación Interactivo
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter text-foreground mb-6 leading-none">
            BATALLA DE<br />
            <span className="campaign-gold-gradient animate-glow-pulse block mt-2">TITULARES</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            La competencia de comedia donde los titulares más <span className="text-campaign-red">absurdos</span> se enfrentan y el público decide.
          </p>

          <div className="space-y-4 w-full max-w-md mx-auto">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Batallas Activas</p>
            {activeBattles.length > 0 ? (
              activeBattles.map(battle => (
                <Link key={battle.id} to={`/votar/${battle.code}`} className="block group">
                  <div className="glass-card rounded-[28px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 hover:bg-white/[0.05] hover:border-campaign-gold/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] group-active:scale-[0.98]">
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-xl truncate mb-1 tracking-tight">{battle.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
                        </span>
                        <p className="text-sm text-status-success font-medium">EN VIVO</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-campaign-gold text-black flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                      <Play className="h-6 w-6 ml-1" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="glass-card rounded-[32px] p-8 mx-auto border-white/5 text-center mt-8">
                <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Preparando el show</h3>
                <p className="text-muted-foreground">El administrador aún no ha iniciado ninguna batalla. Mantente atento a la pantalla principal.</p>
              </div>
            )}
          </div>

          <div className="mt-16 sm:hidden">
            <Link to="/admin">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground rounded-xl">
                Acceso Administrador
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Mobile-Optimized Footer */}
      <footer className="border-t border-white/5 glass-card rounded-none backdrop-blur-lg bg-background/80 px-4 sm:px-6 py-6 sm:py-8 mt-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-3 sm:mb-4 px-2">
            Gracias a <strong className="campaign-gold-gradient">F*cks News Noticreo</strong> por esa comedia ácida
            y bien pensada. Son el apoyo y la risa de mucha gente.
            ¡Esperamos verlos pronto en tarima — la última vez no alcanzamos a comprar boletas!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground font-medium">
            <span>Desarrollado con ❤️ por <strong className="text-campaign-gold font-bold">Jhonatan Lopez Conde</strong></span>
            <span className="hidden sm:inline">•</span>
            <span>Bogotá, Colombia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

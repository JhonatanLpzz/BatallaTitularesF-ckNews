import { Link } from "react-router-dom";
import { Swords, Users, BarChart3, Zap, Star, Globe, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Swords, title: "Batallas en Vivo", desc: "Competencias épicas de titulares con timer automático" },
  { icon: Users, title: "Votación Masiva", desc: "Miles de fans votan simultáneamente desde sus celulares" },
  { icon: BarChart3, title: "Resultados Dramáticos", desc: "Porcentajes en tiempo real con efectos visuales" },
  { icon: Timer, title: "Control Total", desc: "Timer configurable y auto-cierre de batallas" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-vote-gradient flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-campaign-gold/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-campaign-red/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="campaign-accent-bar w-full h-1" />

      {/* Mobile-Optimized Navbar */}
      <nav className="sticky top-0 z-50 campaign-card border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <img src="/logo_fn.png" alt="F*cks News" className="h-8 sm:h-10 drop-shadow-lg" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold campaign-gold-gradient truncate">BATALLA DE TITULARES</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Sistema de Votación Interactivo</p>
            </div>
          </div>
          <Link to="/login">
            <Button size="sm" className="campaign-button font-medium h-9 sm:h-10 px-3 sm:px-4">
              <Star className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Panel </span>Admin
            </Button>
          </Link>
        </div>
      </nav>

      {/* Mobile-Optimized Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight">
              <span className="campaign-gold-gradient animate-glow-pulse block sm:inline">BATALLA DE</span>
              <br className="hidden sm:block" />
              <span className="text-white text-4xl sm:text-5xl md:text-8xl block sm:inline">TITULARES</span>
            </h1>
            <div className="w-16 sm:w-24 h-1 bg-gold-gradient mx-auto mb-6 sm:mb-8 rounded-full" />
          </div>
          
          <p className="text-foreground/80 text-base sm:text-xl md:text-2xl mb-8 sm:mb-12 leading-relaxed font-light max-w-3xl mx-auto px-2">
            La competencia más <strong className="campaign-gold-gradient">épica</strong> de comedia 
            donde los titulares más <strong className="text-campaign-red">absurdos</strong> 
            se enfrentan y el público decide quién reina supremo
          </p>

          <div className="flex flex-col gap-4 justify-center items-center mb-10 sm:mb-16 px-4">
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="campaign-button text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold w-full sm:w-auto">
                <Globe className="h-5 w-5 mr-2 sm:mr-3" />
                <span className="sm:hidden">Panel Admin</span>
                <span className="hidden sm:inline">Acceder al Panel Admin</span>
              </Button>
            </Link>
          </div>

          {/* Live indicator */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-campaign-red/20 border border-campaign-red/30">
            <div className="w-2 h-2 bg-campaign-red rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-campaign-red">Sistema Activo</span>
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Features */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              <span className="campaign-gold-gradient">Tecnología</span> de Vanguardia
            </h2>
            <p className="text-foreground/70 text-sm sm:text-lg max-w-2xl mx-auto px-2">
              Sistema completo de votación interactiva diseñado para shows en vivo
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {FEATURES.map((feature, idx) => (
              <div
                key={feature.title}
                className="campaign-card p-6 sm:p-8 text-center group hover:shadow-gold transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-campaign-gradient rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-campaign-gold" />
                </div>
                <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-white">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Call to Action */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="campaign-card p-8 sm:p-12 animate-fade-in-up">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white">
              ¿Listo para la <span className="campaign-gold-gradient">Batalla?</span>
            </h2>
            <p className="text-foreground/80 text-sm sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto px-2 leading-relaxed">
              Crea batallas épicas, genera códigos QR, y deja que el público decida 
              quién tiene los titulares más geniales
            </p>
            <Link to="/login">
              <Button size="lg" className="campaign-button text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 h-auto font-semibold w-full sm:w-auto">
                Empezar Ahora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Footer */}
      <footer className="border-t border-border/30 campaign-card px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto text-center">
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

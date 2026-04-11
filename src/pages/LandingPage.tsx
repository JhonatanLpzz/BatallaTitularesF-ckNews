import { Link } from "react-router-dom";
import { Zap, QrCode, Trophy, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top accent bar */}
      <div className="fn-accent-bar w-full" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <img src="/logo_fn.png" alt="F*cks News" className="h-9" />
          <Link to="/login">
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-1.5" />
              Admin
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-20 text-center flex-1">
        <div className="animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground mb-4 tracking-tight">
            Batalla de Titulares
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Los comediantes compiten con los titulares mas absurdos.
            <strong className="text-foreground"> Tu decides quien gana.</strong>
          </p>
          <Link to="/login">
            <Button size="lg" className="group">
              Crear Batalla
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-24">
          {[
            {
              icon: Zap,
              title: "Tiempo Real",
              desc: "Los votos se actualizan al instante para vivir la emocion.",
            },
            {
              icon: QrCode,
              title: "Escanea y Vota",
              desc: "Comparte el QR y que el publico vote desde su celular.",
            },
            {
              icon: Trophy,
              title: "Resultados en Vivo",
              desc: "Graficas animadas con porcentajes y el ganador destacado.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="border rounded-lg p-6 text-left hover:border-primary/40 transition-colors bg-white"
            >
              <feature.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-base mb-1">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-6">
        <div className="max-w-5xl mx-auto text-center">
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

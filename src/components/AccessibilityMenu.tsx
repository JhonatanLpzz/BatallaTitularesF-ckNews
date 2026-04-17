import { useState, useEffect } from "react";
import { Accessibility, Type, Eye, Play, Pause, Droplets } from "lucide-react";
import { Button } from "./ui/button";

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [textSize, setTextSize] = useState<"normal" | "large" | "xl">("normal");
  const [highContrast, setHighContrast] = useState(false);
  const [pauseAnimations, setPauseAnimations] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [blurBackground, setBlurBackground] = useState(false);

  useEffect(() => {
    // Manejar tamaño de texto
    document.documentElement.classList.remove("a11y-text-large", "a11y-text-xl");
    if (textSize === "large") document.documentElement.classList.add("a11y-text-large");
    if (textSize === "xl") document.documentElement.classList.add("a11y-text-xl");

    // Manejar alto contraste
    if (highContrast) {
      document.body.classList.add("a11y-high-contrast");
    } else {
      document.body.classList.remove("a11y-high-contrast");
    }

    // Manejar animaciones pausas
    if (pauseAnimations) {
      document.body.classList.add("a11y-reduce-motion");
    } else {
      document.body.classList.remove("a11y-reduce-motion");
    }
    // Manejar fondo global
    if (!showBackground) {
      document.body.classList.add("a11y-hide-bg");
    } else {
      document.body.classList.remove("a11y-hide-bg");
    }

    // Manejar desenfoque de fondo
    if (blurBackground) {
      document.body.classList.add("a11y-blur-bg");
    } else {
      document.body.classList.remove("a11y-blur-bg");
    }
  }, [textSize, highContrast, pauseAnimations, showBackground, blurBackground]);

  const cycleTextSize = () => {
    if (textSize === "normal") setTextSize("large");
    else if (textSize === "large") setTextSize("xl");
    else setTextSize("normal");
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 p-3 glass-medium rounded-2xl flex flex-col gap-2 w-48 animate-fade-in-up">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">
            Accesibilidad
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={cycleTextSize}
          >
            <Type className="h-4 w-4" />
            Texto: {textSize === "normal" ? "Normal" : textSize === "large" ? "Grande" : "Extra"}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full justify-start gap-2 ${highContrast ? 'text-campaign-gold' : ''}`}
            onClick={() => setHighContrast(!highContrast)}
          >
            <Eye className="h-4 w-4" />
            Alto Contraste
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full justify-start gap-2 ${pauseAnimations ? 'text-campaign-red' : ''}`}
            onClick={() => setPauseAnimations(!pauseAnimations)}
          >
            {pauseAnimations ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {pauseAnimations ? "Activar Efectos" : "Pausar Efectos"}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full justify-start gap-2 ${showBackground ? 'text-campaign-blue' : 'text-muted-foreground'}`}
            onClick={() => setShowBackground(!showBackground)}
          >
            <Play className="h-4 w-4 rotate-90" />
            {showBackground ? "Ocultar Fondo" : "Mostrar Fondo"}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full justify-start gap-2 ${blurBackground ? 'text-campaign-blue' : 'text-muted-foreground'}`}
            onClick={() => setBlurBackground(!blurBackground)}
            disabled={!showBackground}
          >
            <Droplets className="h-4 w-4" />
            {blurBackground ? "Quitar Blur" : "Poner Blur"}
          </Button>
        </div>
      )}

      <Button
        variant="secondary"
        size="icon"
        className="rounded-full glass-medium h-12 w-12"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menú de Accesibilidad"
      >
        <Accessibility className="h-6 w-6" />
      </Button>
    </div>
  );
}

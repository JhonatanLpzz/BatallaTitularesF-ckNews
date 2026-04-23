import { useState } from "react";
import { Accessibility, Type, Eye, Play, Pause, Droplets } from "lucide-react";
import { Button } from "./ui/button";
import { useAccessibility } from "@/context/AccessibilityContext";

export function AccessibilityMenu() {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const {
    textSize, highContrast, setHighContrast,
    reduceMotion, setReduceMotion,
    showBackground, setShowBackground,
    blurBackground, setBlurBackground,
    cycleTextSize
  } = useAccessibility();

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      {isOpenMenu && (
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
            className={`w-full justify-start gap-2 ${reduceMotion ? 'text-campaign-red' : ''}`}
            onClick={() => setReduceMotion(!reduceMotion)}
          >
            {reduceMotion ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {reduceMotion ? "Activar Efectos" : "Pausar Efectos"}
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
        onClick={() => setIsOpenMenu(!isOpenMenu)}
        aria-label="Menú de Accesibilidad"
      >
        <Accessibility className="h-6 w-6" />
      </Button>
    </div>
  );
}

import { useState, useCallback } from "react";
import { Accessibility, Type, Eye, Play, Droplets, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { useAccessibility } from "@/context/AccessibilityContext";
import { cn } from "@/lib/utils";
import { useFloatingSnap } from "@/hooks/useFloatingSnap";

export function AccessibilityMenu() {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const {
    textSize, highContrast, setHighContrast,
    reduceMotion,
    showBackground, setShowBackground,
    blurBackground, setBlurBackground,
    cycleTextSize
  } = useAccessibility();

  const toggleMenu = useCallback(() => setIsOpenMenu(prev => !prev), []);

  const { position, isDragging, onPointerDown } = useFloatingSnap(toggleMenu);

  const isLeft = position.x < window.innerWidth / 2;

  return (
    <div 
      className="fixed z-[9999] pointer-events-none select-none"
      style={{
        left: position.x,
        top: position.y,
        transition: isDragging ? "none" : "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      }}
    >
      <AnimatePresence>
        {isOpenMenu && (
          <motion.div 
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: isDragging ? 0 : 20, scale: 0.95 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute bottom-22 p-5 glass glass-shadow glass-ios rounded-[28px] flex flex-col gap-2 w-[260px] pointer-events-auto",
              isLeft ? "left-0 ml-4" : "right-0 mr-4"
            )}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                Accesibilidad
              </div>
              <button 
                onClick={() => setIsOpenMenu(false)}
                className="p-1 rounded-full transition-colors glass border-white/20 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-3 h-11 rounded-xl transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] group"
              onClick={cycleTextSize}
            >
              <Type className="h-4 w-4 opacity-70 group-hover:opacity-100" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Tamaño de Texto</span>
                <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{textSize === "normal" ? "Normal" : textSize === "large" ? "Grande" : "Extra"}</span>
              </div>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full justify-start gap-3 h-11 rounded-xl transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] group",
                highContrast && "bg-[var(--accent-soft)] text-[var(--accent)]"
              )}
              onClick={() => setHighContrast(!highContrast)}
            >
              <Eye className="h-4 w-4 opacity-70 group-hover:opacity-100" />
              <span className="text-sm font-medium" style={{ color: highContrast ? "var(--accent)" : "var(--text-primary)" }}>Alto Contraste</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full justify-start gap-3 h-11 rounded-xl transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] group",
                !showBackground && "bg-[var(--accent-soft)] text-[var(--accent)]"
              )}
              onClick={() => setShowBackground(!showBackground)}
            >
              <Play className="h-4 w-4 rotate-90 opacity-70 group-hover:opacity-100" />
              <span className="text-sm font-medium" style={{ color: !showBackground ? "var(--accent)" : "var(--text-primary)" }}>{showBackground ? "Ocultar Fondo" : "Mostrar Fondo"}</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full justify-start gap-3 h-11 rounded-xl transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] group",
                blurBackground && "bg-[var(--accent-soft)] text-[var(--accent)]"
              )}
              onClick={() => setBlurBackground(!blurBackground)}
              disabled={!showBackground}
            >
              <Droplets className="h-4 w-4 opacity-70 group-hover:opacity-100" />
              <span className="text-sm font-medium" style={{ color: blurBackground ? "var(--accent)" : "var(--text-primary)" }}>{blurBackground ? "Quitar Blur" : "Poner Blur"}</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onPointerDown={onPointerDown}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center pointer-events-auto touch-none transition-all",
          "glass glass-shadow glass-ios text-white",
          !reduceMotion && !isDragging && "hover:scale-110 active:scale-95 hover:text-[var(--accent)] hover:border-[var(--accent)]/50",
          isDragging && "scale-110 cursor-grabbing shadow-[var(--accent-glow)]",
          isOpenMenu && "rotate-90 bg-[var(--accent)] text-black border-transparent shadow-none before:opacity-0"
        )}
        aria-label="Mover menú de accesibilidad"
        aria-expanded={isOpenMenu}
      >
        {isOpenMenu ? <X className="h-6 w-6" /> : <Accessibility className="h-7 w-7" />}
      </button>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { useAccessibility } from "@/context/AccessibilityContext";

export function GlobalBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { blurBackground } = useAccessibility();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const blurValue = Math.min(scrollY / 100, 8); // Max 8px blur
      const opacityValue = Math.max(0.7 - scrollY / 1200, 0.4); // Slightly more opaque
      
      if (containerRef.current) {
        const img = containerRef.current.querySelector("img");
        if (img) {
          // Si el contexto indica blur forzado, no aplicamos el dinámico (el CSS se encarga del !important)
          if (!blurBackground) {
            img.style.filter = `blur(${blurValue}px) brightness(0.85)`;
          }
          img.style.opacity = opacityValue.toString();
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      id="global-background" 
      ref={containerRef}
      className="fixed inset-0 -z-10 bg-background pointer-events-none transition-opacity duration-500 overflow-hidden"
    >
      <img 
        src="/6903870~large.jpg"
        alt="NASA Artemis II"
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />
      
      {/* Soft overlay to improve text contrast on dark background */}
      <div className="absolute inset-0 bg-black/10" />
      
      <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-transparent to-background/40" />
      
      {/* Dynamic light effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-campaign-blue/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/[0.03] rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "3s" }} />
    </div>
  );
}

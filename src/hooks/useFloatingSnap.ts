import { useEffect, useRef, useState, useCallback } from "react";

type Position = { x: number; y: number };

const STORAGE_KEY = "accessibility_fab_position";
const SIZE = 56;
const PADDING = 16;

export function useFloatingSnap(onOpenMenu: () => void) {
  const [position, setPosition] = useState<Position>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse FAB position", e);
      }
    }
    // Default: bottom right with safe padding
    return { 
      x: window.innerWidth - SIZE - PADDING, 
      y: window.innerHeight - SIZE - PADDING - 40 
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startPosRef = useRef<{ x: number, y: number, time: number } | null>(null);

  const clamp = useCallback((x: number, y: number) => {
    const maxX = window.innerWidth - SIZE - PADDING;
    const maxY = window.innerHeight - SIZE - PADDING;
    return {
      x: Math.min(Math.max(PADDING, x), maxX),
      y: Math.min(Math.max(PADDING, y), maxY),
    };
  }, []);

  const snapToSide = useCallback((x: number, y: number) => {
    const midX = window.innerWidth / 2;
    const isLeft = x + SIZE / 2 < midX;
    
    return clamp(
      isLeft ? PADDING : window.innerWidth - SIZE - PADDING,
      y
    );
  }, [clamp]);

  const onPointerDown = (e: React.PointerEvent) => {
    // Solo clic izquierdo o touch
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    
    draggingRef.current = true;
    setIsDragging(true);
    movedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    
    // Capturamos el puntero para que el drag sea fluido incluso si sale del botón
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current) return;

    // Detectar si realmente se movió (threshold)
    if (startPosRef.current) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > 5 || dy > 5) {
        movedRef.current = true;
      }
    }

    if (movedRef.current) {
      const next = clamp(e.clientX - SIZE / 2, e.clientY - SIZE / 2);
      setPosition(next);
    }
  }, [clamp]);

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    setIsDragging(false);

    if (!movedRef.current) {
      // Fue un click real
      onOpenMenu();
    } else {
      // Fue un drag, hacemos snap
      const snapped = snapToSide(position.x, position.y);
      setPosition(snapped);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapped));
    }

    startPosRef.current = null;
  }, [onOpenMenu, position, snapToSide]);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  // Ajuste en resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const snapped = snapToSide(prev.x, prev.y);
        return snapped;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [snapToSide]);

  return {
    position,
    isDragging,
    onPointerDown,
  };
}

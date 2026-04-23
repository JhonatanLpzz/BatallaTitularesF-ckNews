import React, { createContext, useContext, useState, useEffect } from "react";

type TextSize = "normal" | "large" | "xl";

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (enabled: boolean) => void;
  showBackground: boolean;
  setShowBackground: (enabled: boolean) => void;
  blurBackground: boolean;
  setBlurBackground: (enabled: boolean) => void;
  cycleTextSize: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSize] = useState<TextSize>("normal");
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [blurBackground, setBlurBackground] = useState(false);

  // Persistence (optional but recommended for UX)
  useEffect(() => {
    const saved = localStorage.getItem("a11y-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.textSize) setTextSize(parsed.textSize);
        if (parsed.highContrast !== undefined) setHighContrast(parsed.highContrast);
        if (parsed.reduceMotion !== undefined) setReduceMotion(parsed.reduceMotion);
        if (parsed.showBackground !== undefined) setShowBackground(parsed.showBackground);
        if (parsed.blurBackground !== undefined) setBlurBackground(parsed.blurBackground);
      } catch (e) {
        console.error("Failed to parse a11y settings", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("a11y-settings", JSON.stringify({
      textSize, highContrast, reduceMotion, showBackground, blurBackground
    }));

    // Apply classes to document/body for CSS selectors
    const html = document.documentElement;
    const body = document.body;

    // Text size
    html.classList.remove("a11y-text-large", "a11y-text-xl");
    if (textSize === "large") html.classList.add("a11y-text-large");
    if (textSize === "xl") html.classList.add("a11y-text-xl");

    // High contrast
    if (highContrast) body.classList.add("a11y-high-contrast");
    else body.classList.remove("a11y-high-contrast");

    // Reduce motion
    if (reduceMotion) body.classList.add("a11y-reduce-motion");
    else body.classList.remove("a11y-reduce-motion");

    // Show background
    if (!showBackground) body.classList.add("a11y-hide-bg");
    else body.classList.remove("a11y-hide-bg");

    // Blur background
    if (blurBackground) body.classList.add("a11y-blur-bg");
    else body.classList.remove("a11y-blur-bg");

  }, [textSize, highContrast, reduceMotion, showBackground, blurBackground]);

  const cycleTextSize = () => {
    setTextSize(prev => {
      if (prev === "normal") return "large";
      if (prev === "large") return "xl";
      return "normal";
    });
  };

  return (
    <AccessibilityContext.Provider value={{
      textSize, setTextSize,
      highContrast, setHighContrast,
      reduceMotion, setReduceMotion,
      showBackground, setShowBackground,
      blurBackground, setBlurBackground,
      cycleTextSize
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
};

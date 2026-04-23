/**
 * @fileoverview Componente raíz de la aplicación.
 * Configura providers (tema, auth), rutas públicas/privadas y ErrorBoundary global.
 * @module App
 */

import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { HeaderProvider, useHeader } from "./context/HeaderContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import UserManagementPage from "./pages/UserManagementPage";
import VotePage from "./pages/VotePage";
import ResultsPage from "./pages/ResultsPage";
import RankingPage from "./pages/RankingPage";
import { STORAGE_KEY_THEME } from "./constants";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { AccessibilityMenu } from "./components/AccessibilityMenu";
import { GlobalBackground } from "./components/GlobalBackground";
import { Header } from "./components/Header";

function GlobalHeader() {
  const { leftContent, rightContent, showAdminButton } = useHeader();
  return <Header leftContent={leftContent} rightContent={rightContent} showAdminButton={showAdminButton} />;
}

function MouseGlowEffect() {
  const [enabled, setEnabled] = useState(true);
  const mouseX = useMotionValue(window.innerWidth / 2);
  const mouseY = useMotionValue(window.innerHeight / 2);

  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20, mass: 0.5 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20, mass: 0.5 });

  useEffect(() => {
    // Verificar si reduce-motion está activo
    const checkMotion = () => {
      const isReduced = document.documentElement.classList.contains("a11y-reduce-motion") ||
                       document.body.classList.contains("a11y-reduce-motion") ||
                       window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setEnabled(!isReduced);
    };

    checkMotion();
    const observer = new MutationObserver(checkMotion);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    const handleMouseMove = (e: MouseEvent) => {
      if (enabled) {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }
    };

    window.addEventListener("pointermove", handleMouseMove);
    return () => {
      window.removeEventListener("pointermove", handleMouseMove);
      observer.disconnect();
    };
  }, [mouseX, mouseY, enabled]);

  if (!enabled) return null;

  const background = useMotionTemplate`
    radial-gradient(1200px circle at ${smoothX}px ${smoothY}px, rgba(var(--campaign-blue-rgb), 0.12), transparent 40%),
    radial-gradient(800px circle at ${smoothX}px ${smoothY}px, rgba(var(--foreground-rgb), 0.05), transparent 50%)
  `;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[100] mix-blend-screen opacity-80"
      style={{ background }}
    />
  );
}

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(2px)", scale: 1, y: 3 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
      exit={{ opacity: 0, filter: "blur(2px)", scale: 1, y: -3 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex flex-col flex-1 w-full max-w-[100vw] overflow-x-visible min-h-screen"
    >
      {children}
    </motion.div>
  );
};

export default function App() {
  // En rr-v7 inside BrowserRouter we have access to location
  const location = useLocation();

  return (
    <ThemeProvider defaultTheme="dark" storageKey={STORAGE_KEY_THEME}>
      <AuthProvider>
        <HeaderProvider>
          {/* Fondo oscuro profundo base para enmarcar las transiciones */}
          <div className="fixed inset-0 -z-50 bg-background" />

          {/* Contrastes Avanzados: Luces directas y sombras Vignette */}
          <div className="fixed inset-0 -z-40 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_10%,rgba(0,0,0,0.85)_100%)] mix-blend-multiply" />
          <div className="fixed top-0 inset-x-0 h-[60vh] -z-40 pointer-events-none bg-gradient-to-b from-foreground/[0.04] to-transparent mix-blend-screen" />

          <GlobalBackground />
          <MouseGlowEffect />
          <GlobalHeader />
          <AccessibilityMenu />
          <Toaster theme="dark" position="top-center" richColors />
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                {/* Public routes */}
                <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
                <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
                <Route path="/ranking" element={<PageTransition><RankingPage /></PageTransition>} />
                <Route path="/votar/:code" element={<PageTransition><VotePage /></PageTransition>} />
                <Route path="/resultados/:code" element={<PageTransition><ResultsPage /></PageTransition>} />

                {/* Private routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <PageTransition><AdminPage /></PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/usuarios"
                  element={
                    <ProtectedRoute>
                      <PageTransition><UserManagementPage /></PageTransition>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AnimatePresence>
          </ErrorBoundary>
        </HeaderProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

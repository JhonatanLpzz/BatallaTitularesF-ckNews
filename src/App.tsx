/**
 * @fileoverview Componente raíz de la aplicación.
 * Configura providers (tema, auth), rutas públicas/privadas y ErrorBoundary global.
 * @module App
 */

import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import UserManagementPage from "./pages/UserManagementPage";
import VotePage from "./pages/VotePage";
import ResultsPage from "./pages/ResultsPage";
import { STORAGE_KEY_THEME } from "./constants";
import { useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { AccessibilityMenu } from "./components/AccessibilityMenu";

function MouseGlowEffect() {
  const mouseX = useMotionValue(window.innerWidth / 2);
  const mouseY = useMotionValue(window.innerHeight / 2);

  // Very smooth spring physics for the flashlight effect
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20, mass: 0.5 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20, mass: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("pointermove", handleMouseMove);
    return () => window.removeEventListener("pointermove", handleMouseMove);
  }, [mouseX, mouseY]);

  const background = useMotionTemplate`
    radial-gradient(1200px circle at ${smoothX}px ${smoothY}px, rgba(26, 86, 168, 0.12), transparent 40%),
    radial-gradient(800px circle at ${smoothX}px ${smoothY}px, rgba(255, 255, 255, 0.05), transparent 50%)
  `;

  return (
    <motion.div 
      className="pointer-events-none fixed inset-0 z-[100] mix-blend-color-dodge opacity-80"
      style={{ background }}
    />
  );
}

// Wrapper to animate routes nicely
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(4px)", scale: 0.98, y: 5 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
      exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98, y: -5 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex flex-col flex-1 w-full min-h-screen"
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
        {/* Fondo oscuro profundo base para enmarcar las transiciones */}
        <div className="fixed inset-0 -z-50 bg-black" />
        <MouseGlowEffect />
        <AccessibilityMenu />
        <Toaster theme="dark" position="top-center" richColors />
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public routes */}
              <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
              <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
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
      </AuthProvider>
    </ThemeProvider>
  );
}

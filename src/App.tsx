/**
 * @fileoverview Componente raíz de la aplicación.
 * Configura providers (tema, auth), rutas públicas/privadas y ErrorBoundary global.
 * @module App
 */

import { Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey={STORAGE_KEY_THEME}>
      <AuthProvider>
        <Toaster theme="dark" position="top-center" richColors />
        <ErrorBoundary>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/votar/:code" element={<VotePage />} />
          <Route path="/resultados/:code" element={<ResultsPage />} />

          {/* Private routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

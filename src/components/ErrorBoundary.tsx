/**
 * @fileoverview ErrorBoundary genérico para capturar errores de renderizado.
 * Envuelve secciones de la app para evitar que un error en un componente
 * hijo destruya toda la interfaz.
 * @module components/ErrorBoundary
 */

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Props & State
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  /** Contenido hijo que se renderiza normalmente. */
  children: ReactNode;
  /** UI alternativa cuando ocurre un error (opcional). */
  fallback?: ReactNode;
  /** Callback opcional invocado con el error capturado. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Componente class-based que captura errores de renderizado en sus hijos.
 * Muestra un fallback amigable con opción de reintentar.
 *
 * @example
 * <ErrorBoundary>
 *   <AdminPage />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="glass-card rounded-[32px] border border-white/5 bg-white/[0.02] p-10 text-center max-w-md w-full backdrop-blur-3xl">
            <AlertTriangle className="h-14 w-14 text-destructive mx-auto mb-6 opacity-80" />
            <h2 className="text-xl font-bold text-foreground mb-2 tracking-tight">
              Algo salió mal
            </h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Ocurrió un error inesperado. Puedes intentar recargar esta sección.
            </p>
            {this.state.error && (
              <pre className="text-xs text-muted-foreground bg-black/10 dark:bg-black/30 rounded-xl p-4 mb-6 overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Loader2, ChevronRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, setup, needsSetup, isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (needsSetup) {
        await setup(username.trim(), password.trim());
        toast.success("Administrador creado");
      } else {
        await login(username.trim(), password.trim());
        navigate("/admin");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-campaign-gold/30">
      {/* Background blobs decorativos */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-campaign-gold/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-campaign-red/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-[440px] relative animate-fade-in-up">
        <div className="glass-card absolute inset-0 rounded-[32px] -z-10" />

        <div className="p-8 sm:p-10 flex flex-col items-center">
          <img src="/logo_fn.png" alt="F*cks News" className="h-16 sm:h-20 mb-8 drop-shadow-2xl hover:scale-105 transition-transform" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center text-white mb-2">Panel Admin</h1>
          <p className="text-zinc-400 text-center text-sm mb-8 leading-relaxed">Ingresa tus credenciales para acceder al panel de control.</p>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div className="space-y-1.5 font-medium relative">
              <label className="text-[13px] text-zinc-400 ml-1">Usuario</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12"
                  placeholder="Tu usuario"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 font-medium relative">
              <label className="text-[13px] text-zinc-400 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors focus:outline-none"
                  aria-label={showPassword ? "Ocultar Contraseña" : "Ver Contraseña"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                needsSetup ? (
                  <>Crear Administrador</>
                ) : (
                  <>
                    Iniciar Sesión
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )
              )}
            </Button>
          </form>

          {!needsSetup && (
            <Button
              variant="ghost"
              className="mt-8 text-zinc-500 hover:text-white text-sm h-10 px-4 rounded-xl"
              onClick={() => navigate("/")}
            >
              Volver al inicio
            </Button>
          )}
        </div>
      </div>
      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-8">
        Batalla de Titulares — Panel de Administracion
      </p>
    </div>
  );
}

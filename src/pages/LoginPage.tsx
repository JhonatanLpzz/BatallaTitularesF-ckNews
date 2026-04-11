import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, setup, needsSetup, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/admin", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    try {
      if (needsSetup) {
        await setup(username.trim(), password.trim());
        toast.success("Administrador creado");
      } else {
        await login(username.trim(), password.trim());
      }
      
      // Wait a bit for auth state to update before navigation
      setTimeout(() => {
        navigate("/admin", { replace: true });
      }, 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vote-gradient flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-campaign-gold/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-campaign-blue/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="campaign-accent-bar w-full h-1" />
      
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10 animate-fade-in-up">
            <img src="/logo_fn.png" alt="F*cks News" className="h-24 mx-auto mb-8 drop-shadow-2xl" />
            <h1 className="text-3xl font-bold mb-4">
              <span className="campaign-gold-gradient animate-glow-pulse">
                {needsSetup ? "CREAR ADMINISTRADOR" : "ACCESO ADMIN"}
              </span>
            </h1>
            {needsSetup && (
              <p className="text-foreground/80 text-lg">
                Configura el primer usuario administrador del sistema
              </p>
            )}
            <div className="w-16 h-1 bg-gold-gradient mx-auto mt-6 rounded-full" />
          </div>

          {/* Form */}
          <div className="campaign-card p-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Usuario
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                  required
                  autoFocus
                  className="h-12 text-base"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Contraseña
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  required
                  className="h-12 text-base"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 campaign-button text-base font-semibold"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin mr-3" />}
                {needsSetup ? "Crear Administrador" : "Iniciar Sesión"}
              </Button>
            </form>
            
            {!needsSetup && (
              <p className="text-center text-sm text-muted-foreground mt-6">
                Acceso exclusivo para administradores
              </p>
            )}
          </div>
          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            Batalla de Titulares — Panel de Administracion
          </p>
        </div>
      </div>
    </div>
  );
}

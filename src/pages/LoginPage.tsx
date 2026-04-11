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
      navigate("/admin", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top accent bar */}
      <div className="fn-accent-bar w-full" />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/logo_fn.png"
              alt="F*cks News"
              className="h-20 mx-auto mb-6"
            />
            <h1 className="text-xl font-semibold text-foreground">
              {needsSetup ? "Crear Administrador" : "Iniciar Sesion"}
            </h1>
            {needsSetup && (
              <p className="text-sm text-muted-foreground mt-1">
                Configura tu primer usuario administrador
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Usuario
              </label>
              <Input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Contraseña
              </label>
              <Input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  {needsSetup ? "Crear y Entrar" : "Entrar"}
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            Batalla de Titulares — Panel de Administracion
          </p>
        </div>
      </div>
    </div>
  );
}

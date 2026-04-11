import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Edit2, Trash2, Key, User, ArrowLeft, Loader2, LogOut, Swords } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: number;
  username: string;
  createdAt: string;
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { token, username, logout } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Create user dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit user dialogs
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users", { headers: authHeaders });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      return toast.error("Usuario y contraseña requeridos");
    }

    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Usuario creado");
      setShowCreate(false);
      setNewUsername("");
      setNewPassword("");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear usuario");
    } finally {
      setCreating(false);
    }
  };

  const updateUser = async () => {
    if (!editUser) return;

    setUpdating(true);
    try {
      if (editUsername.trim() !== editUser.username) {
        const res = await fetch(`/api/users/${editUser.id}/username`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ username: editUsername.trim() }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
      }

      if (editPassword.trim()) {
        const res = await fetch(`/api/users/${editUser.id}/password`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ password: editPassword.trim() }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
      }

      toast.success("Usuario actualizado");
      setEditUser(null);
      setEditUsername("");
      setEditPassword("");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar usuario");
    } finally {
      setUpdating(false);
    }
  };

  const deleteUser = async (user: AdminUser) => {
    if (!confirm(`Eliminar usuario "${user.username}"?`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar usuario");
    }
  };

  const openEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditUsername(user.username);
    setEditPassword("");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-vote-gradient flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-campaign-gold/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-campaign-blue/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="campaign-accent-bar w-full h-1 fixed top-0 z-[60]" />

      <nav 
        className={cn(
          "fixed top-1 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          scrolled 
            ? "px-2 sm:px-4 py-2" 
            : "px-0 py-0"
        )}
      >
        <div 
          className={cn(
            "mx-auto transition-all duration-300 ease-in-out flex items-center justify-between campaign-card border-b border-border/30",
            scrolled 
              ? "max-w-4xl h-14 rounded-full shadow-lg border px-4 sm:px-6 bg-card/90 backdrop-blur-md" 
              : "max-w-6xl h-16 rounded-none border-x-0 border-t-0 px-6 bg-card/60 backdrop-blur-sm"
          )}
        >
          <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
            <Link to="/" className="shrink-0">
              <img 
                src="/logo_fn.png" 
                alt="F*cks News" 
                className={cn(
                  "drop-shadow-lg transition-all duration-300 hover:scale-105",
                  scrolled ? "h-8" : "h-10 sm:h-12"
                )} 
              />
            </Link>
            <div className={cn("transition-all duration-300 min-w-0", scrolled ? "hidden sm:block" : "block")}>
              <h1 className={cn(
                "font-bold campaign-gold-gradient truncate transition-all duration-300",
                scrolled ? "text-base" : "text-lg"
              )}>PANEL ADMIN</h1>
              <p className={cn(
                "text-muted-foreground transition-all duration-300",
                scrolled ? "text-[10px]" : "text-xs"
              )}>Gestión de Usuarios</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <Button 
              variant="ghost" 
              size={scrolled ? "icon" : "sm"} 
              asChild 
              className="text-foreground hover:text-campaign-gold transition-all"
              title="Batallas"
            >
              <Link to="/admin">
                <Swords className={cn("transition-all", scrolled ? "h-5 w-5" : "h-4 w-4 mr-2")} />
                {!scrolled && <span className="hidden sm:inline">Batallas</span>}
              </Link>
            </Button>
            <div className={cn(
              "text-right transition-all duration-300",
              scrolled ? "hidden" : "hidden sm:block"
            )}>
              <p className="text-xs text-campaign-gold font-medium">{username}</p>
              <p className="text-[10px] text-muted-foreground">Administrador</p>
            </div>
            <Button 
              variant="destructive" 
              size={scrolled ? "icon" : "sm"} 
              onClick={handleLogout}
              className={cn("transition-all", scrolled && "h-8 w-8 rounded-full")}
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-28 sm:pt-32 w-full flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mobile-title">Administradores</h1>
            <p className="text-muted-foreground mobile-text">Gestión de usuarios del sistema</p>
          </div>
          <Button 
            onClick={() => setShowCreate(true)} 
            className="campaign-button mobile-button w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-campaign-gold" />
          </div>
        ) : users.length === 0 ? (
          <div className="campaign-card p-8 sm:p-12 text-center">
            <User className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-2">No hay usuarios</p>
            <p className="text-sm text-muted-foreground/60">Crea el primer administrador</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user, idx) => (
              <div 
                key={user.id} 
                className="campaign-card p-4 sm:p-6 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-campaign-gradient rounded-xl flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-campaign-gold" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-white mobile-title truncate">{user.username}</h3>
                        <p className="text-sm text-muted-foreground mobile-text">
                          Creado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(user)}
                      className="flex-1 sm:flex-none hover:border-campaign-gold hover:text-campaign-gold"
                    >
                      <Edit2 className="h-4 w-4 mr-1 sm:mr-0" />
                      <span className="sm:hidden">Editar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteUser(user)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Usuario</label>
              <Input
                placeholder="Nombre de usuario"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Contraseña</label>
              <Input
                type="password"
                placeholder="Minimo 4 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={createUser} disabled={creating} className="flex-1">
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Crear Usuario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent onClose={() => setEditUser(null)}>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Usuario</label>
              <Input
                placeholder="Nombre de usuario"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Nueva Contraseña <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="password"
                placeholder="Dejar vacio para no cambiar"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
              {editPassword && (
                <p className="text-xs text-muted-foreground mt-1">
                  Cambiar contraseña cerrará todas las sesiones del usuario
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditUser(null)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={updateUser} disabled={updating} className="flex-1">
                {updating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

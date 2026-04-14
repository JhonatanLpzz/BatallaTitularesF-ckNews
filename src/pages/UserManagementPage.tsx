import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Edit2, Trash2, User, Loader2, LogOut, Swords, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";

interface AdminUser {
  id: number;
  username: string;
  createdAt: string;
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <Header
        leftContent={
          <div className="hidden sm:block min-w-0">
            <h1 className="font-bold text-foreground truncate tracking-tight text-lg">PANEL ADMIN</h1>
            <p className="text-muted-foreground text-xs">Gestión de Usuarios</p>
          </div>
        }
        rightContent={
          <>
            <Button
              variant="outline"
              size="toggle-icon"
              onClick={() => navigate('/admin')}
              title="Ver Batallas"
            >
              <Swords className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors h-9 px-3"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-12 mt-16 md:mt-13 animate-fade-in-up">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">Administradores</h1>
            <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
          </div>
          <Button onClick={() => setShowCreate(true)} variant="outline">
            <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            Nuevo Usuario
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin opacity-50" />
          </div>
        ) : users.length === 0 ? (
          <div className="glass-card rounded-[32px] text-center py-20 px-6 animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto mt-10">
            <div className="w-24 h-24 bg-white/5 rounded-[24px] mx-auto flex items-center justify-center mb-8 border border-white/10 shadow-2xl transform -rotate-6">
              <User className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4 tracking-tight">No hay usuarios</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed text-base">Crea el primer administrador del sistema</p>
            <Button onClick={() => setShowCreate(true)} className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-zinc-200 font-semibold shadow-xl hover:-translate-y-1 transition-all">
              <Plus className="h-5 w-5 mr-2" />
              Crear Primer Usuario
            </Button>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {users.map((user, idx) => (
              <div key={user.id} className="glass-card rounded-[32px] overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="px-5 sm:px-8 py-5 sm:py-8 border-b border-white/5 bg-white/[0.01]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] flex items-center justify-center shrink-0 shadow-lg">
                        <User className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xl sm:text-2xl text-foreground tracking-tight truncate">{user.username}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2 mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          Creado: {new Date(user.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(user)}
                        className="flex-1 sm:flex-none h-10 px-4 rounded-xl transition-all"
                      >
                        <Edit2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUser(user)}
                        className="h-10 px-4 rounded-xl shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)} className="glass-card border-white/10 max-w-2xl rounded-[32px] p-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground mb-2 tracking-tight">Nuevo Usuario</DialogTitle>
            <p className="text-sm">Crea un nuevo administrador del sistema</p>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div>
              <label className="text-[13px] ml-1 font-medium mb-1.5 block">Usuario</label>
              <Input
                placeholder="Nombre de usuario"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="text-[13px] ml-1 font-medium mb-1.5 block">Contraseña</label>
              <Input
                type="password"
                placeholder="Mínimo 4 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <Button
              onClick={createUser}
              disabled={creating}
              variant="outline"
            >
              {creating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
              {creating ? "Creando..." : "Crear Usuario"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent onClose={() => setEditUser(null)} className="glass-card border-white/10 max-w-2xl rounded-[32px] p-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground mb-2 tracking-tight">Editar Usuario</DialogTitle>
            <p className="text-sm">Modifica los datos del administrador</p>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div>
              <label className="text-[13px] ml-1 font-medium mb-1.5 block">Usuario</label>
              <Input
                placeholder="Nombre de usuario"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[13px] ml-1 font-medium mb-1.5 block">
                Nueva Contraseña <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="password"
                placeholder="Dejar vacío para no cambiar"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
              {editPassword && (
                <p className="text-xs text-muted-foreground mt-1">
                  Cambiar contraseña cerrará todas las sesiones del usuario
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditUser(null)}
                disabled={updating}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={updateUser} disabled={updating} className="flex-1">
                {updating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Edit2 className="h-5 w-5 mr-2" />}
                {updating ? "Actualizando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

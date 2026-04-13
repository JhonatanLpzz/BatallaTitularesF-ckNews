import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, User, Loader2, LogOut, Swords, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppDialog } from "@/components/AppDialog";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { userService } from "@/services/api";
import type { ApiError } from "@/types";

interface AdminUser {
  id: number;
  username: string;
  role: "admin" | "demo";
  createdAt: string;
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { token, logout, isDemo } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Create user dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "demo">("admin");
  const [creating, setCreating] = useState(false);

  // Edit user dialogs
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await userService.list(token);
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
    if (!token || !newUsername.trim() || !newPassword.trim()) {
      return toast.error("Usuario y contraseña requeridos");
    }

    setCreating(true);
    try {
      await userService.create(token, newUsername.trim(), newPassword.trim(), newRole);
      toast.success("Usuario creado");
      setShowCreate(false);
      setNewUsername("");
      setNewPassword("");
      setNewRole("admin");
      fetchUsers();
    } catch (err) {
      const msg = (err as ApiError)?.message || "Error al crear usuario";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const updateUser = async () => {
    if (!editUser || !token) return;

    setUpdating(true);
    try {
      if (editUsername.trim() !== editUser.username) {
        await userService.updateUsername(token, editUser.id, editUsername.trim());
      }

      if (editPassword.trim()) {
        await userService.updatePassword(token, editUser.id, editPassword.trim());
      }

      toast.success("Usuario actualizado");
      setEditUser(null);
      setEditUsername("");
      setEditPassword("");
      fetchUsers();
    } catch (err) {
      const msg = (err as ApiError)?.message || "Error al actualizar usuario";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const deleteUser = async (user: AdminUser) => {
    if (!token || !confirm(`Eliminar usuario "${user.username}"?`)) return;

    try {
      await userService.delete(token, user.id);
      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (err) {
      const msg = (err as ApiError)?.message || "Error al eliminar usuario";
      toast.error(msg);
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
    <div className="min-h-screen text-foreground flex flex-col relative selection:bg-campaign-blue/30">
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

      {isDemo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center">
          <span className="text-xs font-bold tracking-wider uppercase text-amber-400">Modo Demo — Solo lectura</span>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-12 mt-5 md:mt-4 animate-fade-in-up">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">Administradores</h1>
            <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
          </div>
          {!isDemo && (
            <Button onClick={() => setShowCreate(true)} variant="outline">
              <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Nuevo Usuario
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin opacity-50" />
          </div>
        ) : users.length === 0 ? (
          <div className="glass-card text-center py-20 px-6 animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto mt-10">
            <div className="w-24 h-24 bg-secondary rounded-[24px] mx-auto flex items-center justify-center mb-8 border border-white/10 shadow-2xl transform -rotate-6">
              <User className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4 tracking-tight">No hay usuarios</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed text-base">Crea el primer administrador del sistema</p>
            <Button onClick={() => setShowCreate(true)} className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xl hover:-translate-y-1 transition-all">
              <Plus className="h-5 w-5 mr-2" />
              Crear Primer Usuario
            </Button>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {users.map((user, idx) => (
              <div key={user.id} className="glass-card animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="px-5 sm:px-8 py-5 sm:py-8 border-b border-white/10 bg-muted/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] bg-secondary flex items-center justify-center shrink-0 shadow-lg">
                        <User className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xl sm:text-2xl text-foreground tracking-tight truncate flex items-center gap-2">
                          {user.username}
                          {user.role === "demo" && <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-semibold">Demo</span>}
                          {user.role === "admin" && <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-semibold">Admin</span>}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2 mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          Creado: {new Date(user.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {!isDemo && (
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
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create User Dialog */}
      <AppDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Crear Nuevo Usuario"
        description="Configura un nuevo acceso para el sistema"
        footer={
          <Button onClick={createUser} disabled={creating} className="flex-1 h-12 rounded-xl">
            {creating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Crear Usuario
          </Button>
        }
      >
        <div className="space-y-4">
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

          <div>
             <label className="text-sm font-medium mb-1.5 block">Rol del Usuario</label>
             <select
               className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
               value={newRole}
               onChange={(e) => setNewRole(e.target.value as "admin" | "demo")}
             >
               <option value="admin" className="bg-background">Administrador (Total)</option>
               <option value="demo" className="bg-background">Demo (Solo Lectura)</option>
             </select>
          </div>
        </div>
      </AppDialog>

      {/* Edit User Dialog */}
      <AppDialog
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Editar Usuario"
        description="Modifica las credenciales existentes"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditUser(null)} className="flex-1 h-12 rounded-xl">
              Cancelar
            </Button>
            <Button onClick={updateUser} disabled={updating} className="flex-1 h-12 rounded-xl">
              {updating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Guardar Cambios
            </Button>
          </>
        }
      >
        <div className="space-y-4">
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
        </div>
      </AppDialog>
    </div>
  );
}

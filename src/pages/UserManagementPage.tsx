import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Key, User, ArrowLeft, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fn-accent-bar w-full" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src="/logo_fn.png" alt="F*cks News" className="h-8" />
            <span className="text-sm text-muted-foreground">/ Usuarios</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{username}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold">Administradores</h1>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo Usuario
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Creado: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {user.username === username && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded">TU</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUser(user)}
                        disabled={user.username === username || users.length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

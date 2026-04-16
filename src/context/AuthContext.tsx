import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

/** Roles de usuario del sistema. */
type UserRole = "admin" | "demo";

interface AuthState {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsSetup: boolean;
}

interface AuthContextType extends AuthState {
  /** `true` si el usuario autenticado es de solo lectura (demo). */
  isDemo: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setup: (username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "batalla-admin-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem(STORAGE_KEY),
    username: null,
    role: null,
    isAuthenticated: false,
    isLoading: true,
    needsSetup: false,
  });

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEY);

    // Check if setup is needed
    try {
      const setupRes = await fetch("/api/auth/needs-setup");
      const { needsSetup } = await setupRes.json();
      if (needsSetup) {
        setState({
          token: null,
          username: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
          needsSetup: true,
        });
        return;
      }
    } catch {
      // ignore
    }

    if (!token) {
      setState((s) => ({ ...s, isLoading: false, isAuthenticated: false }));
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setState({
          token,
          username: data.username,
          role: data.role || "admin",
          isAuthenticated: true,
          isLoading: false,
          needsSetup: false,
        });
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setState({
          token: null,
          username: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
          needsSetup: false,
        });
      }
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al iniciar sesion");
    }

    const data = await res.json();
    localStorage.setItem(STORAGE_KEY, data.token);
    setState({
      token: data.token,
      username: data.username,
      role: data.role || "admin",
      isAuthenticated: true,
      isLoading: false,
      needsSetup: false,
    });
  };

  const logout = async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    setState({
      token: null,
      username: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      needsSetup: false,
    });
  };

  const setup = async (username: string, password: string) => {
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al crear administrador");
    }

    // Auto-login after setup
    await login(username, password);
  };

  return (
    <AuthContext.Provider value={{ ...state, isDemo: state.role === "demo", login, logout, setup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

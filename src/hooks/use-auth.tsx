import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { apiFetch, clearTokens } from "@/api/client";

interface AuthUser {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  roles: string[];
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const u = await apiFetch<AuthUser>("/api/auth/profile");
      setUser(u);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function signOut() {
    try {
      await apiFetch("/api/auth/signout", { method: "POST" });
    } catch {}
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

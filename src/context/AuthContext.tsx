import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  name?: string;
}

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  token: string | null;
  signIn: (identifier: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_STORAGE_KEY = "teenliwa_admin_user";
const TOKEN_STORAGE_KEY = "teenliwa_admin_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);

          // Verify token asynchronously with server
          try {
            const res = await fetch("/api/auth/verify", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            });
            if (!res.ok) {
              // Token expired or invalid
              setUser(null);
              setToken(null);
              localStorage.removeItem(AUTH_STORAGE_KEY);
              localStorage.removeItem(TOKEN_STORAGE_KEY);
            }
          } catch {
            // Offline or network error: retain cached session
          }
        } else {
          setUser(null);
          setToken(null);
        }
      } catch {
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const signIn = async (identifier: string, pass: string) => {
    const cleanId = identifier.trim();
    const cleanPass = pass.trim();

    if (!cleanId || !cleanPass) {
      throw new Error("يرجى إدخال اسم المستخدم وكلمة المرور للمشرف");
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: cleanId,
        password: cleanPass,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
    }

    const authenticatedUser: User = data.user || {
      id: "admin-1",
      username: cleanId,
      email: cleanId.includes("@") ? cleanId : `${cleanId}@teenliwa.com`,
      role: "admin",
      name: "مشرف متجر تين ليوا",
    };

    const authToken = data.token || "admin_session_token";

    setUser(authenticatedUser);
    setToken(authToken);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const isAdmin = Boolean(user && user.role === "admin");

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

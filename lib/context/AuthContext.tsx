"use client";

// lib/context/AuthContext.tsx
// React context that holds the current admin session.
// On mount, it calls /api/auth/session to restore an existing session from the HttpOnly cookie.
// All other components use the useAuth() hook to access auth state.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AdminSession, LoginRequest, LoginResponse } from "@/lib/types/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthContextValue {
  /** Current logged-in admin, or null if not authenticated */
  user: Omit<AdminSession, "iat" | "exp"> | null;
  /** True while the session is being checked on mount */
  loading: boolean;
  /** True when a login request is in-flight */
  signingIn: boolean;
  /** True when the user is authenticated */
  isAuthenticated: boolean;
  /** True when the user is a superadmin */
  isSuperAdmin: boolean;
  /**
   * Login the admin. Returns an error message string on failure, or null on success.
   */
  login: (credentials: LoginRequest) => Promise<string | null>;
  /** Log out — clears cookie and resets auth state */
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  // On mount: try to restore session from HttpOnly cookie via API
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user) setUser(data.user);
        }
      } catch (err) {
        console.error("❌ Session restore failed:", err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<string | null> => {
      setSigningIn(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(credentials),
        });

        const data: LoginResponse = await res.json();

        if (data.success && data.user) {
          setUser(data.user);
          return null; // no error
        }

        return data.error ?? "Login failed. Please try again.";
      } catch (err) {
        console.error("❌ Login error:", err);
        return "A network error occurred. Please try again.";
      } finally {
        setSigningIn(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("❌ Logout error:", err);
    } finally {
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signingIn,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === "superadmin",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

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

  const [deactivatedState, setDeactivatedState] = useState<{
    isDeactivated: boolean;
    countdown: number;
  }>({
    isDeactivated: false,
    countdown: 120, // 2 minutes
  });

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
      setDeactivatedState({ isDeactivated: false, countdown: 120 });
    }
  }, []);

  // On mount: try to restore session from HttpOnly cookie via API
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data.user) setUser(data.user);
          }
        }
      } catch (err) {
        console.error("❌ Session restore failed:", err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Heartbeat to update lastActiveAt and check deactivation
  useEffect(() => {
    if (!user || user.role === "superadmin") {
      setDeactivatedState({ isDeactivated: false, countdown: 120 });
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/auth/heartbeat", { method: "POST", credentials: "include" });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data.success && data.isActive === false) {
              setDeactivatedState((prev) => {
                if (prev.isDeactivated) return prev;
                return { isDeactivated: true, countdown: 120 };
              });
            }
          }
        }
      } catch (err) {
        console.error("❌ Heartbeat failed:", err);
      }
    };

    // Send heartbeat immediately on auth
    checkStatus();

    const interval = setInterval(checkStatus, 15000); // every 15 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Countdown timer effect
  useEffect(() => {
    if (!deactivatedState.isDeactivated) return;

    const timer = setInterval(() => {
      setDeactivatedState((prev) => {
        if (prev.countdown <= 1) {
          clearInterval(timer);
          logout();
          return { isDeactivated: false, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [deactivatedState.isDeactivated, logout]);

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

        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          return `Server error (${res.status}). Please try again.`;
        }

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

  const value: AuthContextValue = {
    user,
    loading,
    signingIn,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === "superadmin",
    login,
    logout,
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {deactivatedState.isDeactivated && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0f2233] border border-red-500/30 rounded-2xl shadow-2xl p-6 text-center space-y-5 animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Account Deactivated</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Your account has been deactivated. Please contact the administrator to activate.
              </p>
            </div>

            <div className="py-3 px-4 bg-red-500/5 border border-red-500/20 rounded-xl max-w-xs mx-auto">
              <p className="text-xs text-red-400 font-medium">
                You will be automatically logged out in:
              </p>
              <p className="text-2xl font-mono font-bold text-red-500 mt-1">
                {formatTime(deactivatedState.countdown)}
              </p>
            </div>
            
            <button
              onClick={logout}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-950/30"
            >
              Log Out Now
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
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

"use client";

import AdminLogin from "./components/Adminlogin";
import Maindashboard from "./components/Maindashboard";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  // While checking session cookie on first mount, show a minimal loading screen
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0D1F2D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="w-10 h-10 animate-spin text-teal-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  return <>{isAuthenticated ? <Maindashboard /> : <AdminLogin />}</>;
}
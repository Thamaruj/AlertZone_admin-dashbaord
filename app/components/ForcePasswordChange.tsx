"use client";

// app/components/ForcePasswordChange.tsx
// Renders a forced password change screen for admins logging in with their initial temporary password.
// Completely blocks access to dashboard tabs until they change their password.

import { useState, useEffect } from "react";
import Image from "next/image";
import logo1 from "../assets/logo1.png";
import { useAuth } from "@/lib/hooks/useAuth";

export default function ForcePasswordChange() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const isValid =
    form.currentPassword.length > 0 &&
    form.newPassword.length >= 8 &&
    form.newPassword === form.confirmPassword;

  const passwordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: "", color: "", width: "0%" };
    if (pwd.length < 8) return { label: "Too short", color: "bg-red-500", width: "25%" };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasUpper, hasNum, hasSymbol].filter(Boolean).length;
    if (score === 0) return { label: "Weak", color: "bg-orange-500", width: "40%" };
    if (score === 1) return { label: "Fair", color: "bg-yellow-500", width: "60%" };
    if (score === 2) return { label: "Good", color: "bg-teal-500", width: "80%" };
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  };

  const strength = passwordStrength(form.newPassword);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to change password.");

      setSuccess("Password updated successfully. Loading your dashboard...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const EyeIcon = ({ show }: { show: boolean }) =>
    show ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    );

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200 disabled:opacity-60";

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0d1f2d] overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a1a26] via-[#0d2233] to-[#0a2a2a] opacity-90" />
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-cyan-900/20 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 sm:p-6">
        {/* Top label */}
        <div className="absolute top-4 left-6 z-10 hidden sm:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-slate-400 text-xs font-mono tracking-widest uppercase">
            Security Notice
          </span>
        </div>

        {/* Card */}
        <div
          className={`w-full max-w-[760px] flex flex-col justify-center transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex flex-col md:flex-row bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            {/* Left Side: Brand & Icon */}
            <div className="md:w-5/12 bg-gradient-to-br from-[#0e2538] to-[#0a1e2e]/80 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/5">
              <div className="relative w-full aspect-square max-w-[120px] md:max-w-[140px] flex items-center justify-center">
                <Image
                  src={logo1}
                  alt="AlertZone Logo"
                  fill
                  sizes="(max-width: 768px) 140px, 140px"
                  className="opacity-95 object-contain drop-shadow-2xl"
                  priority
                />
              </div>
              <div className="mt-4 text-center space-y-1">
                <h2 className="text-slate-200 text-lg font-bold tracking-wide">AlertZone</h2>
                <p className="text-teal-400/80 text-[11px] font-medium uppercase tracking-wider">
                  Administration Portal
                </p>
                <div className="pt-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-block mt-1">
                  🔑 Initial Login
                </div>
              </div>
            </div>

            {/* Right Side: Password Change Form */}
            <form onSubmit={handleSubmit} className="md:w-7/12 px-6 py-5 sm:px-8 sm:py-6 space-y-4">
              <div>
                <h1 className="text-white text-lg font-bold">Update Password</h1>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                  Hi @{user?.username}, for security, you are required to change your temporary password on your first login.
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5 animate-shake">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-400 text-xs font-medium leading-relaxed">{error}</p>
                </div>
              )}

              {/* Success banner */}
              {success && (
                <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-xl px-3.5 py-2.5">
                  <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-teal-300 text-xs font-medium">{success}</p>
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300 tracking-wide">
                  Current Temporary Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={form.currentPassword}
                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    disabled={loading || !!success}
                    className={inputClass}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <EyeIcon show={showPasswords} />
                    </svg>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300 tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    placeholder="Min. 8 characters"
                    disabled={loading || !!success}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <EyeIcon show={showPasswords} />
                    </svg>
                  </button>
                </div>

                {/* Strength meter */}
                {form.newPassword.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">Password Strength:</span>
                      <span className={`font-bold uppercase tracking-wider ${strength.color.replace("bg-", "text-")}`}>
                        {strength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300 tracking-wide">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    disabled={loading || !!success}
                    className={`${inputClass} ${
                      form.confirmPassword && form.newPassword !== form.confirmPassword
                        ? "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/10"
                        : ""
                    }`}
                    autoComplete="new-password"
                  />
                </div>
                {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                  <p className="text-[11px] text-red-400">Passwords do not match.</p>
                )}
              </div>

              {/* Actions Row */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={logout}
                  disabled={loading}
                  className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-slate-300 text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer text-center"
                >
                  Cancel & Logout
                </button>
                <button
                  type="submit"
                  disabled={!isValid || loading || !!success}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-teal-900/30 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Updating…
                    </>
                  ) : (
                    "Save & Continue"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Copyright */}
          <p className="text-center text-[11px] text-slate-500 mt-4 opacity-80">
            © 2026 AlertZone Municipal Infrastructure. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

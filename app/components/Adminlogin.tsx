"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import logo1 from "../assets/logo1.png";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AdminLogin() {
  const { login, signingIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Trigger entrance animation after mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    const errorMsg = await login({ username: username.trim(), password, keepLoggedIn: false });
    if (errorMsg) {
      setError(errorMsg);
    }
  };

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
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-slate-400 text-xs font-mono tracking-widest uppercase">
            Admin Login
          </span>
        </div>

        {/* Card */}
        <div
          className={`w-full max-w-[760px] flex flex-col justify-center transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex flex-col md:flex-row bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            {/* Left Side: Logo */}
            <div className="md:w-5/12 bg-gradient-to-br from-[#0e2538] to-[#0a1e2e]/80 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/5">
              <div className="relative w-full aspect-square max-w-[180px] flex items-center justify-center">
                <Image
                  src={logo1}
                  alt="AlertZone Logo"
                  fill
                  sizes="(max-width: 768px) 180px, 180px"
                  className="opacity-95 object-contain drop-shadow-2xl"
                  priority
                />
              </div>
              <div className="hidden md:block mt-4 text-center space-y-1">
                <h2 className="text-slate-200 text-lg font-bold tracking-wide">AlertZone</h2>
                <p className="text-teal-400/80 text-[11px] font-medium uppercase tracking-wider">
                  Administration Portal
                </p>
              </div>

            </div>

            {/* Right Side: Form */}
            <form
              onSubmit={handleSubmit}
              className="md:w-7/12 px-6 py-5 sm:px-8 sm:py-6 space-y-3"
            >
              <div className="mb-1">
                <h1 className="text-white text-lg font-bold">Sign in</h1>
                <p className="text-slate-400 text-xs mt-0.5">Enter your admin credentials to continue</p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 animate-shake">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-400 text-xs font-medium">{error}</p>
                </div>
              )}

              {/* Username */}
              <div className="space-y-1">
                <label
                  htmlFor="username"
                  className="block text-xs font-medium text-slate-300 tracking-wide"
                >
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-teal-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter your admin username"
                    disabled={signingIn}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all duration-200 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-300 tracking-wide"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-teal-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••••"
                    disabled={signingIn}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all duration-200 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>



              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  id="login-submit"
                  disabled={signingIn}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-teal-900/40 hover:shadow-teal-800/50 active:scale-[0.98] tracking-wide"
                >
                  {signingIn ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    "Sign in to Dashboard"
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5 pt-1" />

              {/* Security Notice */}
              <div className="flex gap-2.5 items-start">
                <svg className="w-4 h-4 text-teal-500/60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[10px] text-slate-400 leading-tight">
                  This is a secure government system. Unauthorized access is prohibited and may be subject to legal action.
                </p>
              </div>

              {/* Footer Links */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-0.5">
                {["Privacy Policy", "Security Standards", "Contact Support"].map((link) => (
                  <button
                    key={link}
                    type="button"
                    className="text-[10px] text-slate-500 hover:text-teal-400 transition-colors duration-150"
                  >
                    {link}
                  </button>
                ))}
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
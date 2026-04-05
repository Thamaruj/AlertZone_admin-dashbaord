"use client";

import { useState } from "react";
import Image from "next/image";
import logo1 from "../assets/logo1.png";

type AdminLoginProps = {
  onLogin?: () => void;
};

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    if (onLogin) {
      onLogin();
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
        <div className="absolute top-4 left-6 z-10 hidden sm:block">
          <span className="text-slate-400 text-xs font-mono tracking-widest uppercase">
            Admin Login
          </span>
        </div>

        {/* Card */}
        <div className="w-full max-w-[760px] flex flex-col justify-center">
          <div className="flex flex-col md:flex-row bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">

            {/* Left Side: Logo */}
            <div className="md:w-5/12 bg-gradient-to-br from-[#0e2538] to-[#0a1e2e]/80 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/5">
              <div className="relative w-full aspect-square max-w-[180px] flex items-center justify-center">
                <Image
                  src={logo1}
                  alt="AlertZone Logo"
                  fill
                  className="opacity-95 object-contain drop-shadow-2xl"
                  priority
                />
              </div>
              <div className="hidden md:block mt-4 text-center space-y-1">
                <h2 className="text-slate-200 text-lg font-bold tracking-wide">AlertZone</h2>
                <p className="text-teal-400/80 text-[11px] font-medium uppercase tracking-wider">Administration Portal</p>
              </div>
            </div>

            {/* Right Side: Form */}
            <div className="md:w-7/12 px-6 py-5 sm:px-8 sm:py-6 space-y-2.5">

              {/* Username */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300 tracking-wide">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-teal-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your admin username"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-1.5 text-sm text-slate-200 placeholder:text-slate-300 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300 tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-teal-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your admin email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-1.5 text-sm text-slate-200 placeholder:text-slate-300 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300 tracking-wide">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors duration-150 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-teal-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-1.5 text-sm text-slate-200 placeholder:text-slate-300 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3.5 flex items-center text-slate-300 hover:text-slate-300 transition-colors"
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

              {/* Keep me logged in */}
              <div className="flex items-center gap-2.5">
                <div
                  onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                  className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all duration-200 flex-shrink-0 ${keepLoggedIn
                    ? "bg-teal-500 border-teal-500"
                    : "bg-white/5 border border-slate-600 hover:border-teal-500/50"
                    }`}
                >
                  {keepLoggedIn && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                  className="text-xs text-slate-400 cursor-pointer select-none"
                >
                  Keep me logged in on this device
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-lg transition-all duration-200 shadow-lg shadow-teal-900/40 hover:shadow-teal-800/50 active:scale-[0.98] tracking-wide"
                >
                  {isLoading ? (
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
              <div className="border-t border-white/5 pt-2" />

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
                {["Privacy Policy", "Security Standards", "Contact Admin"].map((link) => (
                  <button
                    key={link}
                    type="button"
                    className="text-[10px] text-slate-300 hover:text-teal-400 transition-colors duration-150"
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-center text-[11px] text-slate-300 mt-4 opacity-80">
            © 2026 AlertZone Municipal Infrastructure. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
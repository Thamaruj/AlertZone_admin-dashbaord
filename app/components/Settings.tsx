"use client";

// app/components/Settings.tsx
// Admin dashboard Settings page.
// Lets each admin view their account info, update their display name,
// and change their password. Superadmins see a read-only view since
// their credentials are managed via .env.local.

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0f2233]/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-teal-500/30 hover:shadow-[0_0_40px_rgba(20,184,166,0.05)] transition-all duration-300">
      {/* Card header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-bold text-slate-200 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function Toast({
  type,
  message,
  onDismiss,
}: {
  type: "success" | "error";
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3.5 px-4.5 py-3.5 rounded-xl border text-xs font-semibold animate-slide-up shadow-lg ${
        type === "success"
          ? "bg-teal-500/10 border-teal-500/20 text-teal-300 shadow-teal-950/20"
          : "bg-red-500/10 border-red-500/20 text-red-300 shadow-red-950/20"
      }`}
    >
      {type === "success" ? (
        <svg className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span className="flex-1 leading-relaxed">{message}</span>
      <button onClick={onDismiss} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer p-0.5 rounded hover:bg-white/5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Profile Edit Form ────────────────────────────────────────────────────────

function EditProfileForm({ currentDisplayName }: { currentDisplayName: string }) {
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isDirty = displayName.trim() !== currentDisplayName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to update profile.");

      setToast({
        type: "success",
        message: "Display name updated successfully. Reloading to apply changes…",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {toast && (
        <Toast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />
      )}

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your full name"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200"
        />
        <p className="text-xs text-slate-500 leading-normal">This name is shown in the sidebar and across the admin panel.</p>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!isDirty || loading}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg shadow-teal-900/30 transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Change Password Form ─────────────────────────────────────────────────────

function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    if (form.newPassword !== form.confirmPassword) {
      setToast({ type: "error", message: "New passwords do not match." });
      return;
    }
    setLoading(true);
    setToast(null);

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

      setToast({ type: "success", message: "Password changed successfully. Please use your new password next time you log in." });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
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
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-10 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {toast && (
        <Toast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />
      )}

      {/* Current Password */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Current Password</label>
        <div className="relative">
          <input
            type={showPasswords ? "text" : "password"}
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            placeholder="Enter your current password"
            className={inputClass}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            tabIndex={-1}
            className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <EyeIcon show={showPasswords} />
            </svg>
          </button>
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">New Password</label>
        <div className="relative">
          <input
            type={showPasswords ? "text" : "password"}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            placeholder="Min. 8 characters"
            className={inputClass}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            tabIndex={-1}
            className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <EyeIcon show={showPasswords} />
            </svg>
          </button>
        </div>

        {/* Strength bar */}
        {form.newPassword.length > 0 && (
          <div className="space-y-1.5 mt-2">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                style={{ width: strength.width }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-medium">Password Strength:</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${strength.color.replace("bg-", "text-")}`}>
                {strength.label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm New Password */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Confirm New Password</label>
        <div className="relative">
          <input
            type={showPasswords ? "text" : "password"}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Re-enter new password"
            className={`${inputClass} ${
              form.confirmPassword && form.newPassword !== form.confirmPassword
                ? "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/10"
                : ""
            }`}
            autoComplete="new-password"
          />
        </div>
        {form.confirmPassword && form.newPassword !== form.confirmPassword && (
          <p className="text-xs text-red-400">Passwords do not match.</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!isValid || loading}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg shadow-teal-900/30 transition-all duration-200 active:scale-[0.98] cursor-pointer"
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
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Update Password
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Main Settings Component ──────────────────────────────────────────────────

export default function Settings() {
  const { user, isSuperAdmin, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [logins, setLogins] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      try {
        const [actRes, logRes] = await Promise.all([
          fetch(`/api/admin-activities?adminId=${user.id}`, { credentials: "include" }),
          fetch(`/api/admin-logins?adminId=${user.id}`, { credentials: "include" }),
        ]);
        if (actRes.ok && logRes.ok) {
          const actData = await actRes.json();
          const logData = await logRes.json();
          setActivities(actData.logs ?? []);
          setLogins(logData.logs ?? []);
        }
      } catch (err) {
        console.error("❌ Failed to fetch admin settings logs:", err);
      } finally {
        setLogsLoading(false);
      }
    };
    fetchLogs();
  }, [user?.id]);

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const { storage } = await import("@/lib/firebase");
      
      const storageRef = ref(storage, `admin-avatars/${user.id}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatarUrl: downloadUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save profile picture");

      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const initials = getInitials(user.displayName);
  const roleLabel = isSuperAdmin ? "Super Admin" : "Admin";
  const roleColor = isSuperAdmin ? "text-purple-300 bg-purple-500/15 border-purple-500/30" : "text-teal-300 bg-teal-500/15 border-teal-500/30";

  return (
    <>
      <div className="space-y-6 animate-slide-up">
        {/* ── Page Header ── */}
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-teal-300 tracking-tight pb-1">
            Settings
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Manage your admin account settings, security preferences, and view platform configuration.
          </p>
        </div>

        {/* ── Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN (1 col) ── */}
          <div className="lg:col-span-1 space-y-6">

            {/* My Account Card */}
            <SectionCard
              title="My Account"
              subtitle="Your admin profile overview"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            >
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4 pb-6 border-b border-white/5 mb-6">
                <div className="relative group">
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 opacity-20 blur-sm group-hover:opacity-40 transition duration-500" />
                  <label
                    htmlFor="avatar-file-input"
                    className="relative w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-black shadow-xl select-none overflow-hidden cursor-pointer border-2 border-transparent hover:border-teal-400 transition-all duration-300"
                  >
                    {uploading ? (
                      <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                    {/* Camera icon overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </label>
                  <input
                    type="file"
                    id="avatar-file-input"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-teal-400 border-3 border-[#0f2233] shadow-md flex items-center justify-center" />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-base font-extrabold text-white tracking-tight">{user.displayName}</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleColor}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-1">
                <InfoRow label="Username" value={`@${user.username}`} mono />
                <InfoRow label="Role" value={roleLabel} />
                
                {/* Scoping Fields */}
                <InfoRow 
                  label="Assigned Scope" 
                  value={
                    user.scope 
                      ? user.scope === "all" 
                        ? "All Sri Lanka" 
                        : user.scope.toUpperCase() 
                      : "All Sri Lanka"
                  } 
                />
                {user.scope && user.scope !== "all" && user.province && (
                  <InfoRow label="Province" value={user.province} />
                )}
                {user.scope && user.scope !== "all" && user.district && (
                  <InfoRow label="District" value={user.district} />
                )}
                {user.scope && user.scope !== "all" && user.lga && (
                  <InfoRow label="LGA" value={user.lga} />
                )}

                <InfoRow
                  label="Account Status"
                  value={
                    <span className="flex items-center gap-1.5 text-teal-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                      Active
                    </span>
                  }
                />
                <InfoRow
                  label="Session ID"
                  value={user.id === "superadmin" ? "superadmin" : user.id.slice(0, 8) + "…"}
                  mono
                />
              </div>

              {/* Superadmin notice */}
              {isSuperAdmin && (
                <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <svg className="w-4.5 h-4.5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-purple-300 leading-relaxed font-medium">
                    Superadmin credentials are managed securely via environment configuration and cannot be modified from the web panel.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* About AlertZone Card */}
            <SectionCard
              title="About AlertZone"
              subtitle="System configuration details"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <div className="space-y-1">
                <InfoRow label="Platform" value="AlertZone Admin Dashboard" />
                <InfoRow label="Version" value="1.0.0-beta" mono />
                <InfoRow label="Framework" value="Next.js 16 (App Router)" />
                <InfoRow label="Firebase Project" value="alertzone-3d2a3" mono />
                <InfoRow label="Environment" value={process.env.NODE_ENV ?? "development"} mono />
                <InfoRow label="Region" value="Sri Lanka 🇱🇰" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <a
                  href="https://console.firebase.google.com/project/alertzone-3d2a3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/30 rounded-xl py-3 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Firebase Console
                </a>
                <a
                  href="https://github.com/Thamaruj/AlertZone_admin-dashbaord"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/30 rounded-xl py-3 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub Repo
                </a>
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT COLUMN (2 cols) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Edit Profile Card */}
            <SectionCard
              title="Edit Profile"
              subtitle="Update your admin display name"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            >
              {isSuperAdmin ? (
                <div className="flex items-start gap-4.5 p-4.5 rounded-xl bg-white/3 border border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Read-Only Superadmin Access</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Your display name is managed securely via <code className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-[11px]">SUPERADMIN_DISPLAY_NAME</code> in your environment settings.
                    </p>
                  </div>
                </div>
              ) : (
                <EditProfileForm currentDisplayName={user.displayName} />
              )}
            </SectionCard>

            {/* Change Password Card */}
            <SectionCard
              title="Change Password"
              subtitle="Keep your account secure with a strong password"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            >
              {isSuperAdmin ? (
                <div className="flex items-start gap-4.5 p-4.5 rounded-xl bg-white/3 border border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Managed via Environment</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      To change password, generate a bcrypt hash and update <code className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-[11px]">SUPERADMIN_PASSWORD_HASH</code> in <code className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-[11px] font-semibold">.env.local</code>.
                    </p>
                  </div>
                </div>
              ) : (
                <ChangePasswordForm />
              )}
            </SectionCard>

            {/* Session Card (styled with red border for logout) */}
            <div className="bg-[#0f2233]/70 backdrop-blur-xl border border-red-500/20 rounded-2xl overflow-hidden hover:shadow-[0_0_30px_rgba(239,68,68,0.03)] transition-all duration-300">
              <div className="px-6 py-5 border-b border-red-500/10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-red-300 tracking-tight">Session Management</h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage your active admin login session</p>
                </div>
              </div>
              <div className="p-6 flex items-center justify-between gap-6 flex-wrap">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-200">Sign Out of Admin Portal</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Instantly terminate your session and clear active cookies from this browser.
                  </p>
                </div>
                <button
                  id="settings-logout-btn"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all duration-200 flex-shrink-0 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>

            {/* My Activity Log Card */}
            <SectionCard
              title="My Activity Log"
              subtitle="Recent actions performed on the platform"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            >
              {logsLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-10 bg-white/5 rounded-xl" />
                  <div className="h-10 bg-white/5 rounded-xl" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No activities recorded.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {activities.map((log) => (
                    <div key={log.id} className="p-3 bg-white/3 border border-white/5 rounded-xl flex justify-between gap-3 text-xs animate-slide-up">
                      <div>
                        <p className="text-slate-200 font-medium leading-relaxed">{log.details}</p>
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-teal-500/10 text-[9px] font-bold text-teal-400 uppercase mt-1">
                          {log.action}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap self-start">
                        {new Date(log.timestamp).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true, month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Login History Card */}
            <SectionCard
              title="Login History"
              subtitle="Audit log of your recent sessions"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            >
              {logsLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-10 bg-white/5 rounded-xl" />
                  <div className="h-10 bg-white/5 rounded-xl" />
                </div>
              ) : logins.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No logins found.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {logins.map((log) => (
                    <div key={log.id} className="p-3 bg-white/3 border border-white/5 rounded-xl text-xs space-y-1.5 animate-slide-up">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <span className="text-slate-200 font-semibold">{log.location}</span>
                        <span className="text-[10px] font-mono text-slate-400">{log.ip}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3">
                        <span>In: {new Date(log.loginAt).toLocaleString()}</span>
                        {log.logoutAt ? (
                          <span className="text-teal-400">Out: {new Date(log.logoutAt).toLocaleString()}</span>
                        ) : (
                          <span className="text-yellow-400 font-medium">Active Session</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-[#0f2233] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl shadow-black/85 z-10 animate-slide-up">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">Confirm Sign Out</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Are you sure you want to sign out of the AlertZone Administration Portal? You will need to enter your credentials to log in again.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={logout}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-red-950/40 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

// app/components/AdminUserManagement.tsx
// Superadmin-only screen for managing admin user accounts.
// Allows creating new admins, toggling active/inactive status, and deleting accounts.

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import type { AdminUser, AdminRole } from "@/lib/types/auth";
import { ADMIN_ROLES } from "@/lib/constants/auth";
import { sriLankaGeographics } from "@/lib/constants/sriLankaRegions";

type SafeAdminUser = Omit<AdminUser, "passwordHash">;

// ─── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: AdminRole }) {
  const meta = ADMIN_ROLES[role];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-white/5"
      style={{
        color: meta.color,
        backgroundColor: `${meta.color}18`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-white/10 ${
        isActive
          ? "text-teal-300 bg-teal-500/15"
          : "text-red-200 bg-red-500/25 border-red-500/30"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-teal-400 animate-pulse" : "bg-red-400 animate-pulse"}`} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Admin Form Modal (Create / Edit) ──────────────────────────────────────────

interface AdminFormModalProps {
  adminToEdit?: SafeAdminUser | null;
  onClose: () => void;
  onCreated: () => void;
}

function AdminFormModal({ adminToEdit, onClose, onCreated }: AdminFormModalProps) {
  const [form, setForm] = useState({
    username: adminToEdit?.username || "",
    displayName: adminToEdit?.displayName || "",
    password: "",
    confirmPassword: "",
    role: (adminToEdit?.role || "admin") as AdminRole,
    province: adminToEdit?.province || "",
    district: adminToEdit?.district || "",
    lga: adminToEdit?.lga || "",
    scope: (adminToEdit?.scope || "all") as "all" | "province" | "district" | "lga",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Common checks
    if (!form.displayName.trim()) {
      setError("Display Name is required");
      return;
    }

    if (!adminToEdit) {
      // Create validation
      if (!form.username.trim() || !form.password) {
        setError("All fields are required");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
    }

    // Validate Scoping
    if (form.scope === "province" && !form.province) {
      setError("Please select an assigned province for this scope");
      return;
    }
    if (form.scope === "district" && !form.district) {
      setError("Please select an assigned district for this scope");
      return;
    }
    if (form.scope === "lga" && !form.lga) {
      setError("Please select an assigned LGA for this scope");
      return;
    }

    setLoading(true);
    try {
      if (adminToEdit) {
        // Edit Mode (PATCH API)
        const res = await fetch(`/api/admin-users/${adminToEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            displayName: form.displayName.trim(),
            role: form.role,
            province: form.scope === "all" ? "" : form.province,
            district: (form.scope === "all" || form.scope === "province") ? "" : form.district,
            lga: form.scope !== "lga" ? "" : form.lga,
            scope: form.scope,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update admin user");
      } else {
        // Create Mode (POST API)
        const res = await fetch("/api/admin-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: form.username.trim(),
            displayName: form.displayName.trim(),
            password: form.password,
            role: form.role,
            province: form.scope === "all" ? "" : form.province,
            district: (form.scope === "all" || form.scope === "province") ? "" : form.district,
            lga: form.scope !== "lga" ? "" : form.lga,
            scope: form.scope,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create admin user");
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-[#0f2233] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4 animate-slide-up max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h2 className="text-base font-bold text-white">{adminToEdit ? "Edit Admin Settings" : "Add Admin User"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {adminToEdit ? `Modifying @${adminToEdit.username}` : "Create a new admin account"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 animate-pulse">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-xs font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Account Credentials */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-teal-500 rounded-full" />
                Account Credentials
              </h3>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Username</label>
                <input
                  type="text"
                  autoComplete="off"
                  disabled={!!adminToEdit}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. john_admin"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                />
              </div>

              {/* Display Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Display Name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="e.g. John Perera"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all font-medium"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Role</label>
                <select
                  value={form.role}
                  disabled={adminToEdit?.id === "superadmin"}
                  onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="admin" className="bg-[#0f2233]">Admin</option>
                  <option value="superadmin" className="bg-[#0f2233]">Super Admin</option>
                </select>
              </div>

              {/* Passwords (Only in Create Mode) */}
              {!adminToEdit && (
                <>
                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Min. 8 characters"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 pr-10 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                        tabIndex={-1}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          ) : (
                            <>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Confirm Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all font-medium"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Regional Scope Settings */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-teal-500 rounded-full" />
                Regional Scope & Visibility
              </h3>

              {/* Visibility Scope */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Visibility Scope</label>
                <select
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all cursor-pointer font-medium"
                >
                  <option value="all" className="bg-[#0f2233]">All Regions (Unrestricted)</option>
                  <option value="province" className="bg-[#0f2233]">Scope to Province</option>
                  <option value="district" className="bg-[#0f2233]">Scope to District</option>
                  <option value="lga" className="bg-[#0f2233]">Scope to LGA</option>
                </select>
              </div>

              {/* Scoped Province */}
              <div className="space-y-1">
                <label className={`text-xs font-medium ${form.scope === "all" ? "text-slate-500" : "text-slate-300"}`}>Assigned Province</label>
                <select
                  value={form.province}
                  disabled={form.scope === "all"}
                  onChange={(e) => setForm({ ...form, province: e.target.value, district: "", lga: "" })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                >
                  <option value="" className="bg-[#0f2233]">-- Select Province --</option>
                  {Object.keys(sriLankaGeographics).map((prov) => (
                    <option key={prov} value={prov} className="bg-[#0f2233]">{prov} Province</option>
                  ))}
                </select>
              </div>

              {/* Scoped District */}
              <div className="space-y-1">
                <label className={`text-xs font-medium ${(form.scope === "all" || form.scope === "province") ? "text-slate-500" : "text-slate-300"}`}>Assigned District</label>
                <select
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value, lga: "" })}
                  disabled={form.scope === "all" || form.scope === "province" || !form.province}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                >
                  <option value="" className="bg-[#0f2233]">-- Select District --</option>
                  {form.province && Object.keys(sriLankaGeographics[form.province] || {}).map((dist) => (
                    <option key={dist} value={dist} className="bg-[#0f2233]">{dist}</option>
                  ))}
                </select>
              </div>

              {/* Scoped LGA */}
              <div className="space-y-1">
                <label className={`text-xs font-medium ${form.scope !== "lga" ? "text-slate-500" : "text-slate-300"}`}>Assigned LGA</label>
                <select
                  value={form.lga}
                  onChange={(e) => setForm({ ...form, lga: e.target.value })}
                  disabled={form.scope !== "lga" || !form.district}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                >
                  <option value="" className="bg-[#0f2233]">-- Select LGA --</option>
                  {form.province && form.district && (sriLankaGeographics[form.province]?.[form.district] || []).map((lgaItem) => (
                    <option key={lgaItem} value={lgaItem} className="bg-[#0f2233]">{lgaItem}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-900/30 active:scale-[0.98] cursor-pointer uppercase tracking-wider"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : adminToEdit ? "Save Changes" : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminUserManagement() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<SafeAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<SafeAdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showLogsForAdmin, setShowLogsForAdmin] = useState<{
    id: string;
    username: string;
    displayName: string;
  } | null>(null);
  
  // Custom action confirmation states
  const [confirmAction, setConfirmAction] = useState<{
    type: "deactivate" | "activate" | "delete";
    userId: string;
    username: string;
    displayName: string;
    currentActive?: boolean;
  } | null>(null);
  const [isIrreversibleChecked, setIsIrreversibleChecked] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch admin users");
      const data = await res.json();
      setAdmins(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleToggleActiveClick = (userId: string, username: string, displayName: string, currentActive: boolean) => {
    setConfirmAction({
      type: currentActive ? "deactivate" : "activate",
      userId,
      username,
      displayName,
      currentActive,
    });
  };

  const executeToggleActive = async (userId: string, currentActive: boolean) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin-users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to update admin user");
      await fetchAdmins();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleDeleteClick = (userId: string, username: string, displayName: string) => {
    setIsIrreversibleChecked(false);
    setConfirmAction({
      type: "delete",
      userId,
      username,
      displayName,
    });
  };

  const executeDelete = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin-users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete admin user");
      await fetchAdmins();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const targetAdmin = confirmAction ? admins.find((a) => a.id === confirmAction.userId) : null;
  const isTargetOnline =
    targetAdmin
      ? targetAdmin.lastActiveAt
        ? Date.now() - new Date(targetAdmin.lastActiveAt).getTime() < 20000
        : false
      : false;
  const isTargetActive = targetAdmin ? targetAdmin.isActive : false;

  return (
    <>
      <div className="space-y-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-teal-300 tracking-tight pb-1">
              Admin Users
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage admin accounts. Only visible to Super Admins.
            </p>
          </div>
          <button
            id="add-admin-btn"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg shadow-teal-900/40 transition-all duration-200 active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Admin
          </button>
        </div>

        {/* Superadmin info card */}
        <div className="bg-[#0f2233]/80 border border-purple-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-300">
              Superadmin account: <span className="font-mono text-white">{currentUser?.username}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              The superadmin account cannot be modified here.
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Admin Accounts
            </h2>
            <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
              {admins.length} account{admins.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="p-8 space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-white/5 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={fetchAdmins}
                className="mt-3 text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm">No additional admin accounts yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium"
              >
                + Add your first admin
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="bg-white/3 text-slate-400 font-semibold uppercase tracking-wide text-[10px] border-b border-white/5">
                    <th className="px-5 py-3 text-left">Admin</th>
                    <th className="px-5 py-3 text-left">Username</th>
                    <th className="px-5 py-3 text-left">Role</th>
                    <th className="px-5 py-3 text-left">Scope / Region</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Created</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {admins.map((admin) => {
                    const initials = admin.displayName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <tr key={admin.id} className={`transition-colors group border-b border-white/5 ${admin.isActive ? "hover:bg-white/3" : "bg-red-500/20 hover:bg-red-500/30 text-red-100"}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {initials}
                            </div>
                            <span className={`font-semibold ${admin.isActive ? "text-slate-200" : "text-red-100 font-bold"}`}>{admin.displayName}</span>
                          </div>
                        </td>
                        <td className={`px-5 py-3.5 font-mono font-semibold ${admin.isActive ? "text-slate-400" : "text-red-200"}`}>{admin.username}</td>
                        <td className="px-5 py-3.5">
                          <RoleBadge role={admin.role} />
                        </td>
                        <td className="px-5 py-3.5">
                          {(() => {
                            const a = admin as any;
                            if (a.scope === "province") {
                              return (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/10 w-fit">
                                    Province Scope
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{a.province} Province</span>
                                </div>
                              );
                            }
                            if (a.scope === "district") {
                              return (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/10 w-fit">
                                    District Scope
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{a.district}, {a.province}</span>
                                </div>
                              );
                            }
                            if (a.scope === "lga") {
                              return (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/10 w-fit">
                                    LGA Scope
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{a.lga}</span>
                                </div>
                              );
                            }
                            return (
                              <span className="inline-flex items-center text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                All Sri Lanka
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge isActive={admin.isActive} />
                        </td>
                        <td className={`px-5 py-3.5 font-mono text-[11px] ${admin.isActive ? "text-slate-400" : "text-red-300"}`}>
                          {admin.createdAt
                            ? new Date(admin.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                             {/* Toggle active */}
                             {admin.id !== "superadmin" ? (
                               <button
                                 onClick={() => handleToggleActiveClick(admin.id, admin.username, admin.displayName, admin.isActive)}
                                 disabled={actionLoading === admin.id}
                                 title={admin.isActive ? "Deactivate" : "Activate"}
                                 className={`p-1.5 rounded-lg transition-all duration-150 ${
                                   admin.isActive
                                     ? "text-yellow-400 hover:bg-yellow-500/10"
                                     : "text-teal-400 hover:bg-teal-500/10"
                                 } disabled:opacity-50`}
                               >
                                 {actionLoading === admin.id ? (
                                   <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                   </svg>
                                 ) : admin.isActive ? (
                                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                   </svg>
                                 ) : (
                                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                   </svg>
                                 )}
                               </button>
                             ) : (
                               <div className="w-8 h-8 flex items-center justify-center text-slate-500" title="Superadmin account cannot be deactivated">
                                 🔒
                               </div>
                             )}

                            {/* Edit Admin Scope / Info */}
                            <button
                              onClick={() => setShowEditModal(admin)}
                              disabled={actionLoading === admin.id}
                              title="Edit Scope & Settings"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-all duration-150 disabled:opacity-50"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* View Logs */}
                            <button
                              onClick={() => setShowLogsForAdmin({ id: admin.id, username: admin.username, displayName: admin.displayName })}
                              disabled={actionLoading === admin.id}
                              title="View Activities & Login History"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-all duration-150 disabled:opacity-50"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>

                            {/* Delete */}
                            {admin.id !== "superadmin" && (
                              <button
                                onClick={() => handleDeleteClick(admin.id, admin.username, admin.displayName)}
                                disabled={actionLoading === admin.id}
                                title="Delete admin"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-50"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <AdminFormModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchAdmins}
        />
      )}

      {/* Edit Admin Modal */}
      {showEditModal && (
        <AdminFormModal
          adminToEdit={showEditModal}
          onClose={() => setShowEditModal(null)}
          onCreated={fetchAdmins}
        />
      )}

      {/* Admin Logs Modal */}
      {showLogsForAdmin && (
        <AdminLogsModal
          adminId={showLogsForAdmin.id}
          username={showLogsForAdmin.username}
          displayName={showLogsForAdmin.displayName}
          onClose={() => setShowLogsForAdmin(null)}
        />
      )}

      {/* Action Confirmation Modal */}
      {confirmAction && (() => {
        // Dynamic Title
        let modalTitle = "";
        if (confirmAction.type === "delete") {
          modalTitle = (isTargetActive || isTargetOnline) ? "Cannot Delete Active Admin" : "Delete Admin Account";
        } else if (confirmAction.type === "activate") {
          modalTitle = "Activate Admin Account";
        } else { // deactivate
          modalTitle = isTargetOnline ? "Warning: Active User" : "Deactivate Admin Account";
        }

        // Dynamic Description
        let modalDesc = "";
        if (confirmAction.type === "delete") {
          modalDesc = (isTargetActive || isTargetOnline)
            ? `${confirmAction.displayName} is active. You cannot delete the account when he's active. Please deactivate and once logged out try deleting.`
            : `Are you sure you want to permanently delete the admin account "${confirmAction.username}"?`;
        } else if (confirmAction.type === "activate") {
          modalDesc = `Are you sure you want to activate the admin account "${confirmAction.username}"? This user will immediately be allowed to access the admin portal.`;
        } else { // deactivate
          modalDesc = isTargetOnline
            ? `${confirmAction.displayName} is currently active on his account. Do you want to continue?`
            : `Are you sure you want to deactivate the admin account "${confirmAction.username}"? This user will be blocked from logging into the admin portal.`;
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmAction(null)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[#0f2233] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  confirmAction.type === "delete" || isTargetOnline
                    ? "bg-red-500/10"
                    : confirmAction.type === "activate"
                    ? "bg-teal-500/10"
                    : "bg-yellow-500/10"
                }`}>
                  {confirmAction.type === "delete" || isTargetOnline ? (
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : confirmAction.type === "activate" ? (
                    <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    {modalTitle}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {modalDesc}
                  </p>
                </div>
              </div>

              {confirmAction.type === "delete" && !(isTargetActive || isTargetOnline) && (
                <div className="space-y-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400 font-medium leading-relaxed">
                    ⚠️ This action is irreversible. The account and its associated database permissions will be permanently removed.
                  </p>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isIrreversibleChecked}
                      onChange={(e) => setIsIrreversibleChecked(e.target.checked)}
                      className="mt-0.5 rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500 focus:ring-offset-0 focus:ring-offset-transparent"
                    />
                    <span className="text-[11px] text-slate-300 leading-tight">
                      I understand that this action is irreversible and permanent. Please confirm to proceed.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {confirmAction.type === "delete" && (isTargetActive || isTargetOnline) ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 transition-all shadow-lg active:scale-[0.98]"
                  >
                    OK
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmAction.type === "delete") {
                          executeDelete(confirmAction.userId);
                        } else {
                          executeToggleActive(confirmAction.userId, confirmAction.currentActive ?? true);
                        }
                      }}
                      disabled={confirmAction.type === "delete" && !isIrreversibleChecked}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                        confirmAction.type === "delete" || (confirmAction.type === "deactivate" && isTargetOnline)
                          ? "bg-red-500 hover:bg-red-400 shadow-red-950/30"
                          : confirmAction.type === "activate"
                          ? "bg-teal-500 hover:bg-teal-400 shadow-teal-950/30"
                          : "bg-yellow-500 hover:bg-yellow-400 shadow-yellow-950/30"
                      }`}
                    >
                      {confirmAction.type === "delete"
                        ? "Permanently Delete"
                        : confirmAction.type === "activate"
                        ? "Activate Account"
                        : isTargetOnline
                        ? "Yes, Continue"
                        : "Deactivate Account"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

// ─── Admin Logs Modal ─────────────────────────────────────────────────────────

interface AdminLogsModalProps {
  adminId: string;
  username: string;
  displayName: string;
  onClose: () => void;
}

function AdminLogsModal({ adminId, username, displayName, onClose }: AdminLogsModalProps) {
  const [activeTab, setActiveTab] = useState<"activities" | "logins">("activities");
  const [activities, setActivities] = useState<any[]>([]);
  const [logins, setLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = activeTab === "activities"
          ? `/api/admin-activities?adminId=${adminId}`
          : `/api/admin-logins?adminId=${adminId}`;
        const res = await fetch(endpoint, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch logs");
        const data = await res.json();
        if (activeTab === "activities") {
          setActivities(data.logs ?? []);
        } else {
          setLogins(data.logs ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [adminId, activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#0f2233] border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col max-h-[80vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">System Logs</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Viewing logs for {displayName} (@{username})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/5 py-3 flex-shrink-0">
          <button
            onClick={() => setActiveTab("activities")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "activities"
                ? "bg-teal-500/10 text-teal-400 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            Activity Log
          </button>
          <button
            onClick={() => setActiveTab("logins")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "logins"
                ? "bg-teal-500/10 text-teal-400 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            Login History
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="space-y-3 py-6 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <p className="text-center text-xs text-red-400 py-10">{error}</p>
          ) : activeTab === "activities" ? (
            activities.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-10">No activities recorded.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((log) => (
                  <div key={log.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-200 leading-normal">{log.details}</p>
                      <span className="inline-flex px-1.5 py-0.5 rounded bg-teal-500/10 text-[9px] font-bold text-teal-400 uppercase">
                        {log.action}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap self-start">
                      {new Date(log.timestamp).toLocaleString("en-US", { hour12: true, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : (
            logins.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-10">No login history found.</p>
            ) : (
              <div className="space-y-3">
                {logins.map((log) => (
                  <div key={log.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{log.ip}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs" title={log.userAgent}>{log.userAgent}</p>
                    </div>
                    <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/3 pt-1.5">
                      <span>Logged In: <span className="text-slate-300 font-mono">{new Date(log.loginAt).toLocaleString()}</span></span>
                      {log.logoutAt ? (
                        <span>Logged Out: <span className="text-teal-400 font-mono">{new Date(log.logoutAt).toLocaleString()}</span></span>
                      ) : (
                        <span className="text-yellow-400 font-semibold">Active Session</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 pt-3 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 rounded-xl border border-white/10 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

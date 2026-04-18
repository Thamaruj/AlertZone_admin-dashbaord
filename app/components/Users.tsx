"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserStatus = "Active" | "Suspended" | "Offline";
type UserRole = "Super Admin" | "Admin" | "Dispatcher" | "Operator";

type User = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    joined: string;
    reportsHandled: number;
    avatar: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USERS: User[] = [
    { id: "USR-001", name: "Alex Morgan", email: "alex.m@alertzone.gov", role: "Super Admin", status: "Active", joined: "Jan 12, 2025", reportsHandled: 452, avatar: "AM" },
    { id: "USR-002", name: "Sarah Chen", email: "s.chen@alertzone.gov", role: "Admin", status: "Active", joined: "Feb 05, 2025", reportsHandled: 284, avatar: "SC" },
    { id: "USR-003", name: "Marcus Wright", email: "m.wright@alertzone.gov", role: "Dispatcher", status: "Offline", joined: "Mar 10, 2025", reportsHandled: 156, avatar: "MW" },
    { id: "USR-004", name: "Elena Rodriguez", email: "e.rod@alertzone.gov", role: "Operator", status: "Active", joined: "Mar 15, 2025", reportsHandled: 92, avatar: "ER" },
    { id: "USR-005", name: "David Kim", email: "d.kim@alertzone.gov", role: "Dispatcher", status: "Suspended", joined: "Apr 02, 2025", reportsHandled: 215, avatar: "DK" },
    { id: "USR-006", name: "James Wilson", email: "j.wilson@alertzone.gov", role: "Operator", status: "Active", joined: "Apr 10, 2025", reportsHandled: 48, avatar: "JW" },
    { id: "USR-007", name: "Lisa Thompson", email: "l.thompson@alertzone.gov", role: "Admin", status: "Offline", joined: "Jan 20, 2025", reportsHandled: 312, avatar: "LT" },
    { id: "USR-008", name: "Robert Taylor", email: "r.taylor@alertzone.gov", role: "Operator", status: "Active", joined: "May 01, 2025", reportsHandled: 12, avatar: "RT" },
];

// ─── Constants & Meta ─────────────────────────────────────────────────────────

const roleMeta: Record<UserRole, { color: string; bg: string }> = {
    "Super Admin": { color: "text-rose-400", bg: "bg-rose-500/10" },
    Admin: { color: "text-teal-400", bg: "bg-teal-500/10" },
    Dispatcher: { color: "text-blue-400", bg: "bg-blue-500/10" },
    Operator: { color: "text-amber-400", bg: "bg-amber-500/10" },
};

const statusMeta: Record<UserStatus, { color: string; bg: string; dot: string }> = {
    Active: { color: "text-teal-400", bg: "bg-teal-500/10", dot: "bg-teal-400" },
    Suspended: { color: "text-rose-400", bg: "bg-rose-500/10", dot: "bg-rose-500" },
    Offline: { color: "text-slate-400", bg: "bg-slate-500/10", dot: "bg-slate-400" },
};

// ─── Components ───────────────────────────────────────────────────────────────

function UserStatCard({ icon, label, value, trend, colorClass }: {
    icon: React.ReactNode; label: string; value: string; trend: string; colorClass: string;
}) {
    return (
        <div className="group bg-[#0f2233]/80 backdrop-blur-md border border-white/5 border-t-white/10 rounded-xl p-4 flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(20,184,166,0.15)] hover:border-teal-500/30">
            <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
                    {icon}
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 group-hover:text-teal-400 transition-colors">
                    {trend}
                </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">{label}</p>
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400 tracking-tight">{value}</p>
        </div>
    );
}

export default function Users() {
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
    const [statusFilter, setStatusFilter] = useState<UserStatus | "All">("All");

    const filteredUsers = useMemo(() => {
        return MOCK_USERS.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                user.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === "All" || user.role === roleFilter;
            const matchesStatus = statusFilter === "All" || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [searchQuery, roleFilter, statusFilter]);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between flex-wrap gap-4 animate-slide-up">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-teal-300 tracking-tight pb-1">Users Management</h1>
                    <p className="text-xs text-slate-300 mt-0.5">Manage administrative roles and municipal operator access.</p>
                </div>
                <button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-teal-900/40 transition-all duration-200 active:scale-[0.98] flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add New User
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up stagger-1">
                <UserStatCard 
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    label="Total Users" value="128" trend="+4 this week" colorClass="text-teal-400"
                />
                <UserStatCard 
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                    label="Verification" value="98%" trend="1 pending" colorClass="text-blue-400"
                />
                <UserStatCard 
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    label="Active Now" value="42" trend="Live stream" colorClass="text-orange-400"
                />
                <UserStatCard 
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    label="Uptime" value="99.9%" trend="Last 30d" colorClass="text-teal-400"
                />
            </div>

            {/* Main Table Container */}
            <div className="bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-2xl overflow-hidden shadow-2xl animate-slide-up stagger-2">
                
                {/* Search & Filters Bar */}
                <div className="p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1 min-w-[300px] relative group">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500/60 group-focus-within:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find user by name, email or ID..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:bg-white/10 focus:border-teal-500/50 transition-all font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Role</span>
                            <select 
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as any)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50"
                            >
                                <option value="All" className="bg-[#0f2233]">All Roles</option>
                                <option value="Super Admin" className="bg-[#0f2233]">Super Admin</option>
                                <option value="Admin" className="bg-[#0f2233]">Admin</option>
                                <option value="Dispatcher" className="bg-[#0f2233]">Dispatcher</option>
                                <option value="Operator" className="bg-[#0f2233]">Operator</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Status</span>
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50"
                            >
                                <option value="All" className="bg-[#0f2233]">All Status</option>
                                <option value="Active" className="bg-[#0f2233]">Active</option>
                                <option value="Suspended" className="bg-[#0f2233]">Suspended</option>
                                <option value="Offline" className="bg-[#0f2233]">Offline</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead>
                            <tr className="bg-white/3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Role / Permissions</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Reports Handled</th>
                                <th className="px-6 py-4">Joined Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => {
                                const role = roleMeta[user.role];
                                const status = statusMeta[user.status];

                                return (
                                    <tr key={user.id} className="hover:bg-white/3 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-teal-400 font-bold text-sm shadow-inner group-hover:scale-105 transition-transform">
                                                    {user.avatar}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white tracking-tight">{user.name}</p>
                                                    <p className="text-[11px] text-slate-400 font-medium">{user.email}</p>
                                                    <p className="text-[9px] text-teal-500/60 font-mono mt-0.5">{user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/5 shadow-sm ${role.bg} ${role.color}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${user.status === 'Active' ? 'animate-pulse' : ''}`} />
                                                <span className={`text-[11px] font-semibold ${status.color}`}>
                                                    {user.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 max-w-[80px] bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-teal-500/50 rounded-full" 
                                                        style={{ width: `${Math.min(100, (user.reportsHandled / 500) * 100)}%` }} 
                                                    />
                                                </div>
                                                <span className="text-xs font-mono font-bold text-slate-300">
                                                    {user.reportsHandled}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-slate-400 font-medium tracking-tight">
                                                {user.joined}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-slate-400 hover:text-teal-400 hover:bg-white/5 rounded-lg transition-all" title="Edit User">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all" title="Suspend User">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="More Options">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center opacity-40">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-4xl mb-4">
                                👥
                            </div>
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em]">No users found</p>
                            <p className="text-[11px] text-slate-500 mt-1">Try adjusting your filters or search query</p>
                        </div>
                    )}
                </div>

                {/* Footer / Pagination Placeholder */}
                <div className="px-6 py-4 bg-white/2 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Showing {filteredUsers.length} of {MOCK_USERS.length} total users
                    </p>
                    <div className="flex items-center gap-1">
                         <button className="px-3 py-1 text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase">Prev</button>
                         <div className="flex gap-1 px-2">
                             <span className="w-6 h-6 rounded bg-teal-500/20 border border-teal-500/40 text-[10px] font-bold text-teal-400 flex items-center justify-center">1</span>
                             <span className="w-6 h-6 rounded hover:bg-white/5 text-[10px] font-bold text-slate-500 flex items-center justify-center cursor-pointer transition-colors">2</span>
                         </div>
                         <button className="px-3 py-1 text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase">Next</button>
                    </div>
                </div>
            </div>

            {/* Role Guidelines Hint */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-3">
                {Object.entries(roleMeta).map(([role, meta]) => (
                    <div key={role} className="p-4 bg-[#0f2233]/40 border border-white/5 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${meta.bg.replace('/10', '')} ${meta.color}`} />
                            <h3 className={`text-[11px] font-bold uppercase tracking-widest ${meta.color}`}>{role}</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">
                            {role === "Super Admin" && "Full system access including infrastructure config and audit logs."}
                            {role === "Admin" && "Regional management, report oversight, and operator assignments."}
                            {role === "Dispatcher" && "Real-time incident response routing and status coordination."}
                            {role === "Operator" && "Field report handling, evidence collection, and status updates."}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

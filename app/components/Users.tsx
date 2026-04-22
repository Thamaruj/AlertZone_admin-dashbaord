"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserStatus = "Active" | "Suspended" | "Pending";
type ReputationLevel = "Gold" | "Silver" | "Bronze" | "None";

type User = {
    id: string;
    name: string;
    email: string;
    points: string;
    reputation: ReputationLevel;
    status: UserStatus;
    avatar: string;
};

// Mock data removed in favor of Firebase real-time connection

// ─── Constants & Meta ─────────────────────────────────────────────────────────

const reputationMeta: Record<ReputationLevel, { color: string; bg: string; border: string }> = {
    Gold: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    Silver: { color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" },
    Bronze: { color: "text-orange-600", bg: "bg-orange-600/10", border: "border-orange-600/20" },
    None: { color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" },
};

const statusMeta: Record<UserStatus, { color: string; bg: string }> = {
    Active: { color: "text-emerald-500", bg: "bg-emerald-500/10" },
    Suspended: { color: "text-rose-500", bg: "bg-rose-500/10" },
    Pending: { color: "text-amber-600", bg: "bg-amber-600/10" },
};

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({ label, value, trend, icon, color }: {
    label: string; value: string; trend: { val: string; type: "up" | "down" }; icon: React.ReactNode; color: string;
}) {
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col gap-1 transition-all duration-300 hover:border-teal-500/40 group">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400">{label}</span>
                <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${color} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${trend.type === "up" ? "text-emerald-400" : "text-rose-400"}`}>
                    {trend.type === "up" ? "↗" : "↘"} {trend.val}
                </span>
            </div>
        </div>
    );
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Real-time listener for Firestore
    useEffect(() => {
        const usersRef = collection(db, "users");
        // Ordering by points (descending) as a default useful view
        const q = query(usersRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersList = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || "Anonymous",
                    email: data.email || "No Email",
                    // Handle points if they are stored as numbers in Firestore
                    points: typeof data.points === 'number' 
                        ? new Intl.NumberFormat().format(data.points) 
                        : (data.points || "0"),
                    reputation: data.reputation || "None",
                    status: data.status || "Pending",
                    avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.id}`,
                } as User;
            });
            setUsers(usersList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching real-time users:", error);
            setLoading(false);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, users]);

    // Calculate dynamic stats from real-time data
    const stats = useMemo(() => {
        const total = users.length;
        const active = users.filter(u => u.status === "Active").length;
        const elite = users.filter(u => u.reputation === "Gold").length;
        
        return {
            total: new Intl.NumberFormat().format(total),
            active: new Intl.NumberFormat().format(active),
            elite: new Intl.NumberFormat().format(elite)
        };
    }, [users]);

    const handleStatusUpdate = async (userId: string, currentStatus: UserStatus) => {
        const newStatus: UserStatus = currentStatus === "Suspended" ? "Active" : "Suspended";
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating user status:", error);
            alert("Failed to update user status.");
        }
    };

    return (
        <div className="space-y-8 animate-slide-up">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-slate-400 mt-1 text-sm font-medium">Manage and monitor registered community members and their reputations across the platform.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up stagger-1">
                <StatCard 
                    label="Total Registered" 
                    value={loading ? "..." : stats.total} 
                    trend={{ val: "Live", type: "up" }}
                    color="text-blue-400"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                />
                <StatCard 
                    label="Active Reporters" 
                    value={loading ? "..." : stats.active} 
                    trend={{ val: "Active", type: "up" }}
                    color="text-cyan-400"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
                />
                <StatCard 
                    label="Elite Contributors" 
                    value={loading ? "..." : stats.elite} 
                    trend={{ val: "Gold", type: "up" }}
                    color="text-amber-400"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                />
            </div>

            {/* Table Section */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-slide-up stagger-2">
                <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md group">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input 
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-w-full inline-block align-middle">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5">User Identity</th>
                                <th className="px-8 py-5">Points</th>
                                <th className="px-8 py-5">Reputation</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                                            <p className="text-slate-400 text-sm font-medium">Connecting to live database...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.03] transition-all group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
                                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">{user.name}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-mono font-bold text-slate-300">{user.points}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${reputationMeta[user.reputation].bg} ${reputationMeta[user.reputation].color} ${reputationMeta[user.reputation].border}`}>
                                                <span className="w-1 h-1 rounded-full bg-current" />
                                                {user.reputation}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${statusMeta[user.status].bg} ${statusMeta[user.status].color}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-6 text-sm font-bold">
                                                <button className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">Manage</button>
                                                <button 
                                                    onClick={() => handleStatusUpdate(user.id, user.status)}
                                                    className={`${user.status === "Suspended" ? "text-blue-400 hover:text-blue-300" : "text-rose-500 hover:text-rose-400"} transition-colors cursor-pointer`}
                                                >
                                                    {user.status === "Suspended" ? "Unsuspend" : "Suspend"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <p className="text-slate-400 text-sm font-medium">No users found matching your search.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <p className="text-xs text-slate-500 font-medium">
                        Showing {filteredUsers.length} of {users.length} total users
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-500 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20">1</button>
                        <button className="w-8 h-8 rounded-lg hover:bg-white/5 text-slate-400 text-xs font-bold transition-colors">2</button>
                        <button className="w-8 h-8 rounded-lg hover:bg-white/5 text-slate-400 text-xs font-bold transition-colors">3</button>
                        <span className="text-slate-600 px-1 font-bold">...</span>
                        <button className="w-8 h-8 rounded-lg hover:bg-white/5 text-slate-400 text-xs font-bold transition-colors">128</button>
                        <button className="p-2 text-slate-500 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

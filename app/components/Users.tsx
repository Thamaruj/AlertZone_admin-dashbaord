"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { UserProfile } from "@/lib/types/user";
import { Report } from "@/lib/types/report";
import { sriLankaGeographics } from "@/lib/constants/sriLankaRegions";
import { BADGE_DEFINITIONS } from "@/lib/constants/badges";

// ─── Constants & Metadata ───────────────────────────────────────────────────
const statusMeta: Record<"active" | "suspended", { color: string; bg: string; border: string }> = {
    active: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    suspended: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const reportStatusMeta: Record<string, { color: string; bg: string; border: string; label: string }> = {
    PENDING: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "Pending" },
    ASSIGNED: { color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", label: "Assigned" },
    FIXING: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", label: "Fixing" },
    RESOLVED: { color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20", label: "Resolved" },
    REJECTED: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Rejected" },
};

const categoryMeta: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    road_traffic: { color: "text-blue-400", bg: "bg-blue-500/10", icon: "🚧", label: "Road & Traffic" },
    water_drainage: { color: "text-sky-400", bg: "bg-sky-500/10", icon: "💧", label: "Water & Drainage" },
    waste_environment: { color: "text-green-400", bg: "bg-green-500/10", icon: "♻️", label: "Waste & Env" },
    social_safety: { color: "text-violet-400", bg: "bg-violet-500/10", icon: "🛡️", label: "Social Safety" },
    bridge_structural: { color: "text-orange-400", bg: "bg-orange-500/10", icon: "🌉", label: "Bridge & Structure" },
    other: { color: "text-slate-400", bg: "bg-slate-500/10", icon: "📍", label: "Other" },
};

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

const getInitials = (name: string) => {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
};

export default function Users() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Overall stats unaffected by active filters
    const [overallStats, setOverallStats] = useState<{ total: number; active: number; elite: number }>({ total: 0, active: 0, elite: 0 });

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedProvince, setSelectedProvince] = useState("all");
    const [selectedDistrict, setSelectedDistrict] = useState("all");
    const [selectedLGA, setSelectedLGA] = useState("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Modals
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userReports, setUserReports] = useState<Report[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    const [confirmAction, setConfirmAction] = useState<{
        type: "suspend" | "unsuspend";
        userId: string;
        userName: string;
        currentStatus: "active" | "suspended";
    } | null>(null);

    // Portal root — always document.body on client
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Lock body scroll while any modal is open
    useEffect(() => {
        if (selectedUser || confirmAction) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [selectedUser, confirmAction]);

    // Debounce search input to avoid hitting backend on every keystroke
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 350);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Fetch users list
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (debouncedSearchQuery) queryParams.set("search", debouncedSearchQuery);
            if (selectedStatus !== "all") queryParams.set("status", selectedStatus);
            if (selectedProvince !== "all") queryParams.set("province", selectedProvince);
            if (selectedDistrict !== "all") queryParams.set("district", selectedDistrict);
            if (selectedLGA !== "all") queryParams.set("lga", selectedLGA);

            const res = await fetch(`/api/users?${queryParams.toString()}`);
            if (!res.ok) {
                throw new Error("Failed to fetch citizen users");
            }
            const data = await res.json();
            setUsers(data.users || []);
            if (data.stats) {
                setOverallStats(data.stats);
            }
            setCurrentPage(1); // Reset page on filter changes
        } catch (err: any) {
            setError(err.message || "An error occurred while fetching users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [debouncedSearchQuery, selectedStatus, selectedProvince, selectedDistrict, selectedLGA]);

    // Reset district and LGA when province changes
    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProvince(e.target.value);
        setSelectedDistrict("all");
        setSelectedLGA("all");
    };

    // Reset LGA when district changes
    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDistrict(e.target.value);
        setSelectedLGA("all");
    };

    // Fetch reports for selected user modal
    useEffect(() => {
        if (selectedUser) {
            setLoadingReports(true);
            fetch(`/api/users/${selectedUser.uid}/reports`)
                .then((res) => {
                    if (!res.ok) throw new Error("Could not retrieve reports");
                    return res.json();
                })
                .then((data) => {
                    setUserReports(data.reports || []);
                })
                .catch((err) => {
                    console.error("Error fetching reports:", err);
                })
                .finally(() => {
                    setLoadingReports(false);
                });
        } else {
            setUserReports([]);
        }
    }, [selectedUser]);

    // Calculate status breakdown from fetched reports
    const reportCounts = useMemo(() => {
        const counts = {
            PENDING: 0,
            ASSIGNED: 0,
            FIXING: 0,
            RESOLVED: 0,
            REJECTED: 0,
            TOTAL: 0,
        };
        userReports.forEach((r) => {
            const s = r.status as keyof typeof counts;
            if (s in counts) {
                counts[s]++;
            }
            counts.TOTAL++;
        });
        return counts;
    }, [userReports]);

    // Update status in Firestore
    const handleStatusUpdate = async (userId: string, currentStatus: "active" | "suspended") => {
        const newStatus = currentStatus === "suspended" ? "active" : "suspended";
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                throw new Error("Failed to update status");
            }
            
            // Update local users list
            setUsers((prev) =>
                prev.map((u) => (u.uid === userId ? { ...u, status: newStatus } : u))
            );

            // Update overall stats locally to keep the active status card in sync
            setOverallStats((prev) => {
                const activeDiff = newStatus === "active" ? 1 : -1;
                return {
                    ...prev,
                    active: prev.active + activeDiff,
                };
            });

            // Update modal state if active
            if (selectedUser?.uid === userId) {
                setSelectedUser((prev) => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (err: any) {
            alert(err.message || "An error occurred while updating status.");
        }
    };

    const handleToggleStatusClick = (
        userId: string,
        userName: string,
        currentStatus: "active" | "suspended"
    ) => {
        setConfirmAction({
            type: currentStatus === "suspended" ? "unsuspend" : "suspend",
            userId,
            userName,
            currentStatus,
        });
    };

    // Filter users locally to ensure instant UI sync when status changes (especially for 'active' / 'suspended' filters)
    const filteredLocalUsers = useMemo(() => {
        return users.filter((user) => {
            // Apply selected status filter locally
            if (selectedStatus !== "all" && (user.status || "active") !== selectedStatus) {
                return false;
            }
            return true;
        });
    }, [users, selectedStatus]);

    // Pagination computations based on filtered local users
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLocalUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLocalUsers, currentPage]);

    const totalPages = Math.ceil(filteredLocalUsers.length / itemsPerPage) || 1;

    // Stats calculations for top cards (showing overall database stats unaffected by filters)
    const stats = useMemo(() => {
        return {
            total: new Intl.NumberFormat().format(overallStats.total),
            active: new Intl.NumberFormat().format(overallStats.active),
            elite: new Intl.NumberFormat().format(overallStats.elite),
        };
    }, [overallStats]);

    // Category formatter helper
    const getCategoryDetails = (catId: string) => {
        return categoryMeta[catId] || categoryMeta.other;
    };

    return (
        <div className="space-y-8 animate-slide-up">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-slate-400 mt-1 text-sm font-medium">Manage and monitor registered community members and their reputations across the platform.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up stagger-1">
                <StatCard 
                    label="Total Registered" 
                    value={stats.total} 
                    trend={{ val: "Live Citizens", type: "up" }}
                    color="text-blue-400"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                />
                <StatCard 
                    label="Active Reporters" 
                    value={stats.active} 
                    trend={{ val: "Active Status", type: "up" }}
                    color="text-cyan-400"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
                />
                <StatCard 
                    label="Elite Contributors" 
                    value={stats.elite} 
                    trend={{ val: "Points > 500", type: "up" }}
                    color="text-amber-400"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                />
            </div>

            {/* Table Section */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-slide-up stagger-2">
                {/* Advanced Filtering Controls */}
                <div className="p-6 border-b border-white/5 flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
                    {/* Left: Search input & Refresh */}
                    <div className="flex items-center gap-3 flex-1 max-w-md w-full">
                        <div className="relative flex-1 group">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input 
                                type="text"
                                placeholder="Search by name, email, phone, NIC, LGA, address..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all font-medium"
                            />
                        </div>
                        <button
                            onClick={fetchUsers}
                            disabled={loading}
                            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-teal-400 hover:bg-white/10 hover:border-teal-500/30 transition-all duration-200 disabled:opacity-50 cursor-pointer flex-shrink-0 uppercase tracking-wider"
                        >
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    {/* Right: Sri Lanka Province/District/LGA/Status Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Province dropdown */}
                        <div className="relative group">
                            <select
                                value={selectedProvince}
                                onChange={handleProvinceChange}
                                className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all min-w-[150px] font-semibold cursor-pointer"
                            >
                                <option value="all" className="bg-[#0b1a26] text-slate-300">All Provinces</option>
                                {Object.keys(sriLankaGeographics).map(province => (
                                    <option key={province} value={province} className="bg-[#0b1a26] text-slate-300">
                                        {province} Province
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* District dropdown (cascading) */}
                        <div className="relative group">
                            <select
                                value={selectedDistrict}
                                onChange={handleDistrictChange}
                                disabled={selectedProvince === "all"}
                                className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all min-w-[150px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/10"
                            >
                                <option value="all" className="bg-[#0b1a26] text-slate-300">All Districts</option>
                                {selectedProvince !== "all" && Object.keys(sriLankaGeographics[selectedProvince] || {}).map(district => (
                                    <option key={district} value={district} className="bg-[#0b1a26] text-slate-300">
                                        {district}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors group-disabled:opacity-40">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* LGA dropdown (cascading) */}
                        <div className="relative group">
                            <select
                                value={selectedLGA}
                                onChange={(e) => setSelectedLGA(e.target.value)}
                                disabled={selectedDistrict === "all"}
                                className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all min-w-[180px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/10"
                            >
                                <option value="all" className="bg-[#0b1a26] text-slate-300">All LGAs</option>
                                {selectedProvince !== "all" && selectedDistrict !== "all" && (sriLankaGeographics[selectedProvince]?.[selectedDistrict] || []).map(lga => (
                                    <option key={lga} value={lga} className="bg-[#0b1a26] text-slate-300">
                                        {lga}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors group-disabled:opacity-40">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Status dropdown */}
                        <div className="relative group">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all min-w-[140px] font-semibold cursor-pointer"
                            >
                                <option value="all" className="bg-[#0b1a26] text-slate-300">All Statuses</option>
                                <option value="active" className="bg-[#0b1a26] text-emerald-400 font-semibold">Active Only</option>
                                <option value="suspended" className="bg-[#0b1a26] text-rose-400 font-semibold">Suspended Only</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Mobile card list (hidden on md+) ── */}
                <div className="md:hidden divide-y divide-white/5">
                    {loading ? (
                        <div className="px-6 py-16 flex flex-col items-center gap-4">
                            <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-teal-400 animate-spin" />
                            <p className="text-slate-400 text-sm font-medium">Fetching registered citizens...</p>
                        </div>
                    ) : error ? (
                        <div className="px-6 py-16 text-center">
                            <p className="text-rose-400 text-sm font-semibold">⚠️ {error}</p>
                        </div>
                    ) : paginatedUsers.length > 0 ? (
                        paginatedUsers.map((user) => (
                            <div
                                key={user.uid}
                                className={`p-4 transition-all ${
                                    user.status === "suspended"
                                        ? "bg-rose-950/25 shadow-[inset_4px_0_0_0_#ef4444]"
                                        : "hover:bg-white/[0.03]"
                                }`}
                            >
                                {/* Top row: avatar + name + status badge */}
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0 cursor-pointer"
                                            onClick={() => setSelectedUser(user)}
                                        >
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                                                    {getInitials(user.fullName)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p
                                                className="text-sm font-bold text-white truncate cursor-pointer"
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                {user.fullName}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                            <p className="text-[10px] text-teal-400 font-bold font-mono mt-0.5">NIC: {user.nic || "N/A"}</p>
                                        </div>
                                    </div>
                                    <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta[user.status || 'active'].bg} ${statusMeta[user.status || 'active'].color} ${statusMeta[user.status || 'active'].border}`}>
                                        {(user.status || 'active').toUpperCase()}
                                    </span>
                                </div>

                                {/* Middle row: contact + gamification */}
                                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-slate-200">{user.phoneNumber || "No Phone"}</p>
                                        <p className="text-slate-400">{user.province ? `${user.province} • ${user.district}` : "No Region"}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{user.localGovernmentArea || user.address || "No Address"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold">
                                                Lvl {user.level || 1}
                                            </span>
                                            <span className="font-bold text-slate-200 font-mono text-[11px]">
                                                {new Intl.NumberFormat().format(user.contributionPoints || 0)} pts
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            Validated: <span className="font-bold text-slate-300 font-mono">{user.reportsValidated || 0}</span>
                                            {user.badges && user.badges.length > 0 && (
                                                <span className="text-teal-400 font-bold ml-1">{user.badges.length} 🏆</span>
                                            )}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom row: action buttons */}
                                <div className="flex gap-2 text-xs font-bold">
                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        className="flex-1 py-1.5 rounded bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 transition-colors cursor-pointer"
                                    >
                                        Manage
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatusClick(user.uid, user.fullName, user.status || 'active')}
                                        className={`flex-1 py-1.5 rounded border transition-colors cursor-pointer ${
                                            (user.status || 'active') === "suspended"
                                                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
                                                : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20"
                                        }`}
                                    >
                                        {(user.status || 'active') === "suspended" ? "Unsuspend" : "Suspend"}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-6 py-16 text-center">
                            <p className="text-slate-400 text-sm font-medium">No citizens found matching your filter criteria.</p>
                        </div>
                    )}
                </div>

                {/* ── Desktop table (hidden below md) ── */}
                <div className="hidden md:block w-full">
                    <table className="w-full text-left table-fixed">
                        <thead>
                            <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                                <th className="px-3 py-4 w-[24%]">User Identity</th>
                                <th className="px-3 py-4 w-[20%]">Contact Details</th>
                                <th className="px-3 py-4 w-[16%]">Gamification</th>
                                <th className="px-3 py-4 w-[12%] whitespace-nowrap">Join Date</th>
                                <th className="px-3 py-4 w-[10%]">Status</th>
                                <th className="px-3 py-4 w-[18%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-teal-400 animate-spin" />
                                            <p className="text-slate-400 text-sm font-medium">Fetching registered citizens...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <p className="text-rose-400 text-sm font-semibold">⚠️ {error}</p>
                                    </td>
                                </tr>
                            ) : paginatedUsers.length > 0 ? (
                                paginatedUsers.map((user) => (
                                    <tr 
                                        key={user.uid} 
                                        className={`transition-all group border-b border-white/5 ${
                                            user.status === "suspended"
                                                ? "bg-rose-950/25 text-rose-200/90 hover:bg-rose-950/35 shadow-[inset_4px_0_0_0_#ef4444]"
                                                : "hover:bg-white/[0.03]"
                                        }`}
                                    >
                                        {/* User Identity Column */}
                                        <td className="px-3 py-4">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0 cursor-pointer"
                                                    onClick={() => setSelectedUser(user)}
                                                >
                                                    {user.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                                                            {getInitials(user.fullName)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p 
                                                        className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors cursor-pointer"
                                                        onClick={() => setSelectedUser(user)}
                                                    >
                                                        {user.fullName}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                                                    <p className="text-[10px] text-teal-400 font-bold font-mono mt-0.5">NIC: {user.nic || "N/A"}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact Details Column */}
                                        <td className="px-3 py-4">
                                            <div className="space-y-0.5 text-xs">
                                                <p className="font-bold text-slate-200">{user.phoneNumber || "No Phone"}</p>
                                                <p className="text-slate-400">{user.province ? `${user.province} • ${user.district}` : "No Region"}</p>
                                                <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]" title={user.localGovernmentArea || user.address}>
                                                    {user.localGovernmentArea ? `${user.localGovernmentArea}` : ""}
                                                    {user.address ? ` (${user.address})` : ""}
                                                    {!user.localGovernmentArea && !user.address && "No Address"}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Gamification Column */}
                                        <td className="px-3 py-4">
                                            <div className="space-y-0.5 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold">
                                                        Lvl {user.level || 1}
                                                    </span>
                                                    <span className="font-bold text-slate-200 font-mono">
                                                        {new Intl.NumberFormat().format(user.contributionPoints || 0)} pts
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                                    <span>Validated: <span className="font-bold text-slate-300 font-mono">{user.reportsValidated || 0}</span></span>
                                                    {user.badges && user.badges.length > 0 && (
                                                        <>
                                                            <span className="text-slate-600">•</span>
                                                            <span className="text-teal-400 font-bold font-mono">{user.badges.length} 🏆</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Join Date Column */}
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            <span className="text-xs text-slate-300 font-medium">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                }) : "N/A"}
                                            </span>
                                        </td>

                                        {/* Status Column */}
                                        <td className="px-3 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta[user.status || 'active'].bg} ${statusMeta[user.status || 'active'].color} ${statusMeta[user.status || 'active'].border}`}>
                                                {(user.status || 'active').toUpperCase()}
                                            </span>
                                        </td>

                                        {/* Actions Column */}
                                        <td className="px-3 py-4">
                                            <div className="flex items-center justify-end gap-1.5 text-xs font-bold">
                                                <button 
                                                    onClick={() => setSelectedUser(user)}
                                                    className="px-2.5 py-1 rounded bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 transition-colors cursor-pointer whitespace-nowrap"
                                                >
                                                    Manage
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleStatusClick(user.uid, user.fullName, user.status || 'active')}
                                                    className={`px-2.5 py-1 rounded border transition-colors cursor-pointer whitespace-nowrap ${
                                                        (user.status || 'active') === "suspended" 
                                                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20" 
                                                            : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20"
                                                    }`}
                                                >
                                                    {(user.status || 'active') === "suspended" ? "Unsuspend" : "Suspend"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <p className="text-slate-400 text-sm font-medium">No citizens found matching your filter criteria.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && !error && users.length > 0 && (
                    <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <p className="text-xs text-slate-500 font-medium">
                            Showing {paginatedUsers.length} of {users.length} total citizens
                        </p>
                        <div className="flex items-center gap-2">
                            {/* Prev page */}
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            
                            {/* Page buttons */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                                        currentPage === page
                                            ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                                            : "hover:bg-white/5 text-slate-400"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {/* Next page */}
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Detail Popup Modal — portalled to document.body */}
            {mounted && selectedUser && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/75 backdrop-blur-md"
                        onClick={() => setSelectedUser(null)}
                    />

                    {/* Modal Container */}
                    <div className="relative w-full max-w-5xl bg-[#0b1a26]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] z-50 animate-slide-up">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border-2 border-teal-500/40 overflow-hidden bg-white/5 flex-shrink-0">
                                    {selectedUser.avatarUrl ? (
                                        <img src={selectedUser.avatarUrl} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-lg font-bold font-mono">
                                            {getInitials(selectedUser.fullName)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                        {selectedUser.fullName}
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusMeta[selectedUser.status || 'active'].bg} ${statusMeta[selectedUser.status || 'active'].color} ${statusMeta[selectedUser.status || 'active'].border}`}>
                                            {(selectedUser.status || 'active').toUpperCase()}
                                        </span>
                                    </h2>
                                    <p className="text-xs text-slate-400 font-medium">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Left Column: Profile Card */}
                                <div className="md:col-span-4 space-y-4">
                                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-4">
                                        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider border-b border-white/5 pb-2">Profile & Identity</h3>
                                        <div className="space-y-3 text-xs">
                                            <div>
                                                <span className="text-slate-500 font-medium">National Identity Card (NIC)</span>
                                                <p className="text-white font-mono font-bold mt-0.5">{selectedUser.nic || "Not Provided"}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 font-medium">Joined Date</span>
                                                <p className="text-white font-medium mt-0.5">
                                                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString(undefined, {
                                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                    }) : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-4">
                                        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider border-b border-white/5 pb-2">Contact Details</h3>
                                        <div className="space-y-3 text-xs">
                                            <div>
                                                <span className="text-slate-500 font-medium">Phone Number</span>
                                                <p className="text-white font-bold mt-0.5">{selectedUser.phoneNumber || "N/A"}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 font-medium">Province</span>
                                                <p className="text-white font-semibold mt-0.5">{selectedUser.province || "N/A"}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 font-medium">District</span>
                                                <p className="text-white font-semibold mt-0.5">{selectedUser.district || "N/A"}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 font-medium">Local Government Area</span>
                                                <p className="text-white font-semibold mt-0.5">{selectedUser.localGovernmentArea || "N/A"}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 font-medium">Home Address</span>
                                                <p className="text-white font-medium mt-0.5 leading-relaxed">{selectedUser.address || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-4">
                                        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider border-b border-white/5 pb-2">Gamification & Contributions</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                                                <span className="text-[10px] text-slate-500 font-medium">Level</span>
                                                <p className="text-lg font-extrabold text-teal-400 font-mono">Lvl {selectedUser.level || 1}</p>
                                            </div>
                                            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                                                <span className="text-[10px] text-slate-500 font-medium">Points</span>
                                                <p className="text-lg font-extrabold text-slate-200 font-mono">{(selectedUser.contributionPoints || 0).toLocaleString()} pts</p>
                                            </div>
                                        </div>
                                        <div className="text-xs space-y-2">
                                            <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg px-3 py-2">
                                                <span className="text-slate-500">Reports Validated</span>
                                                <span className="font-bold text-slate-200 font-mono">{selectedUser.reportsValidated || 0}</span>
                                            </div>
                                            {selectedUser.badges && selectedUser.badges.length > 0 && (
                                                <div className="space-y-2 pt-2">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Earned Badges ({selectedUser.badges.length})</span>
                                                    <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                                        {selectedUser.badges.map((badgeId) => {
                                                            const badgeDef = BADGE_DEFINITIONS.find(b => b.id === badgeId);
                                                            if (!badgeDef) {
                                                                return (
                                                                    <div key={badgeId} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-slate-400">
                                                                        <span>🏆</span>
                                                                        <span className="font-semibold">{badgeId}</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <div 
                                                                    key={badgeId} 
                                                                    className="flex items-center justify-between p-2 rounded-lg border bg-white/[0.01] border-white/5 hover:border-teal-500/20 hover:bg-white/[0.03] transition-all duration-200 group/badge"
                                                                    title={badgeDef.description}
                                                                >
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <span className="text-sm">{badgeDef.icon}</span>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[10px] font-bold text-white leading-tight truncate">{badgeDef.name}</p>
                                                                            <p className="text-[8px] text-slate-400 leading-tight truncate max-w-[120px]">{badgeDef.description}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase border tracking-wider flex-shrink-0 ${badgeDef.tierColor}`}>
                                                                        {badgeDef.tier}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Reports History */}
                                <div className="md:col-span-8 space-y-6">
                                    {/* Reports Status Summary Cards */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold text-slate-300 flex items-center justify-between">
                                            <span>Report History Summary</span>
                                            <span className="text-xs font-medium text-slate-500">Total: {reportCounts.TOTAL}</span>
                                        </h3>
                                        <div className="grid grid-cols-5 gap-2 text-center">
                                            <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg py-2">
                                                <p className="text-xs font-semibold text-orange-400">Pending</p>
                                                <p className="text-base font-extrabold text-orange-200 font-mono mt-0.5">{reportCounts.PENDING}</p>
                                            </div>
                                            <div className="bg-sky-500/5 border border-sky-500/10 rounded-lg py-2">
                                                <p className="text-xs font-semibold text-sky-400">Assigned</p>
                                                <p className="text-base font-extrabold text-sky-200 font-mono mt-0.5">{reportCounts.ASSIGNED}</p>
                                            </div>
                                            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg py-2">
                                                <p className="text-xs font-semibold text-cyan-400">Fixing</p>
                                                <p className="text-base font-extrabold text-cyan-200 font-mono mt-0.5">{reportCounts.FIXING}</p>
                                            </div>
                                            <div className="bg-teal-500/5 border border-teal-500/10 rounded-lg py-2">
                                                <p className="text-xs font-semibold text-teal-400">Resolved</p>
                                                <p className="text-base font-extrabold text-teal-200 font-mono mt-0.5">{reportCounts.RESOLVED}</p>
                                            </div>
                                            <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg py-2">
                                                <p className="text-xs font-semibold text-rose-400">Rejected</p>
                                                <p className="text-base font-extrabold text-rose-200 font-mono mt-0.5">{reportCounts.REJECTED}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reports List */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-slate-300">Submitted Reports List</h3>
                                        
                                        {loadingReports ? (
                                            <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                                <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-teal-400 animate-spin" />
                                                <p className="text-xs text-slate-500 font-medium">Retrieving submitted reports...</p>
                                            </div>
                                        ) : userReports.length === 0 ? (
                                            <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                                                <p className="text-sm text-slate-400 font-bold">No reports submitted</p>
                                                <p className="text-xs text-slate-500">This citizen has not submitted any reports yet.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                                                {userReports.map((report) => {
                                                    const cat = getCategoryDetails(report.categoryId);
                                                    const rStatus = reportStatusMeta[report.status] || {
                                                        color: "text-slate-400",
                                                        bg: "bg-slate-500/10",
                                                        border: "border-slate-500/20",
                                                        label: report.status
                                                    };
                                                    return (
                                                        <div
                                                            key={report.id}
                                                            className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-xl p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4 group"
                                                        >
                                                            <div className="space-y-1.5">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${cat.bg} ${cat.color}`}>
                                                                        <span>{cat.icon}</span>
                                                                        <span>{cat.label}</span>
                                                                    </span>
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${rStatus.bg} ${rStatus.color} ${rStatus.border}`}>
                                                                        {rStatus.label.toUpperCase()}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500 font-semibold font-mono">
                                                                        {report.id}
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-xs font-bold text-white group-hover:text-teal-400 transition-colors line-clamp-1">
                                                                    {report.title}
                                                                </h4>
                                                                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                                                    {report.description}
                                                                </p>
                                                                {report.location && (
                                                                    <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                                                        <svg className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        </svg>
                                                                        <span className="truncate max-w-[320px]">{report.location.address || report.location.area || "No Address details"}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex-shrink-0 text-right text-[10px] text-slate-500 font-medium self-end sm:self-start">
                                                                {report.createdAt ? new Date(report.createdAt).toLocaleDateString(undefined, {
                                                                    month: 'short', day: 'numeric', year: '2-digit'
                                                                }) : "N/A"}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between gap-4">
                            <button
                                onClick={() => handleToggleStatusClick(selectedUser.uid, selectedUser.fullName, selectedUser.status || 'active')}
                                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                                    (selectedUser.status || 'active') === "suspended"
                                        ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
                                        : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20"
                                }`}
                            >
                                {(selectedUser.status || 'active') === "suspended" ? "Unsuspend User Account" : "Suspend User Account"}
                            </button>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors cursor-pointer"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Action Confirmation Modal — portalled to document.body */}
            {mounted && confirmAction && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setConfirmAction(null)}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-md bg-[#0f2233] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4 animate-slide-up">
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                confirmAction.type === "suspend" ? "bg-rose-500/10" : "bg-emerald-500/10"
                            }`}>
                                {confirmAction.type === "suspend" ? (
                                    <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-white">
                                    {confirmAction.type === "suspend" ? "Suspend User Account" : "Unsuspend User Account"}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {confirmAction.type === "suspend"
                                        ? `Are you sure you want to suspend the user "${confirmAction.userName}"? Suspended users will be restricted from submitting reports and posting platform updates.`
                                        : `Are you sure you want to unsuspend the user "${confirmAction.userName}"? This user will immediately regain full access and status on the platform.`}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleStatusUpdate(confirmAction.userId, confirmAction.currentStatus);
                                    setConfirmAction(null);
                                }}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-lg active:scale-[0.98] cursor-pointer ${
                                    confirmAction.type === "suspend"
                                        ? "bg-rose-500 hover:bg-rose-400 shadow-rose-950/30"
                                        : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-950/30"
                                }`}
                            >
                                {confirmAction.type === "suspend" ? "Suspend Account" : "Unsuspend Account"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

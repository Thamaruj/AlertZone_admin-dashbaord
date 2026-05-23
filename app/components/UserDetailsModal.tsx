"use client";

import { useState, useEffect, useMemo } from "react";
import { UserProfile } from "@/lib/types/user";
import { Report } from "@/lib/types/report";
import { categoryStyleMeta } from "@/lib/constants/categories";
import { statusStyleMeta } from "@/lib/constants/statuses";

const reportStatusMeta: Record<string, { color: string; bg: string; border: string; label: string }> = {
    PENDING: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "Pending" },
    ASSIGNED: { color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", label: "Assigned" },
    FIXING: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", label: "Fixing" },
    RESOLVED: { color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20", label: "Resolved" },
    REJECTED: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Rejected" },
};

const getInitials = (name: string) => {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
};

export default function UserDetailsModal({ 
    user, 
    onClose, 
    onStatusUpdate 
}: { 
    user: UserProfile; 
    onClose: () => void;
    onStatusUpdate?: (userId: string, currentStatus: "active" | "suspended") => void;
}) {
    const [userReports, setUserReports] = useState<Report[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    useEffect(() => {
        if (user) {
            setLoadingReports(true);
            fetch(`/api/users/${user.uid}/reports`)
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
        }
    }, [user]);

    const reportCounts = useMemo(() => {
        const counts = { PENDING: 0, ASSIGNED: 0, FIXING: 0, RESOLVED: 0, REJECTED: 0, TOTAL: 0 };
        userReports.forEach((r) => {
            const s = r.status as keyof typeof counts;
            if (s in counts) counts[s]++;
            counts.TOTAL++;
        });
        return counts;
    }, [userReports]);

    const getCategoryDetails = (catId: string) => {
        const catName = Object.keys(categoryStyleMeta).find(k => k.toLowerCase().includes(catId.replace('_', ' '))) || "Other";
        const cat = categoryStyleMeta[catName];
        return {
            icon: cat.icon,
            color: cat.color,
            bg: cat.bg,
            label: catName
        };
    };

    const sMeta: Record<"active" | "suspended", { color: string; bg: string; border: string }> = {
        active: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
        suspended: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-[#0b1a26]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] z-50 animate-slide-up">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full border-2 border-teal-500/40 overflow-hidden bg-white/5 flex-shrink-0">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-lg font-bold font-mono">
                                    {getInitials(user.fullName)}
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                {user.fullName}
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${sMeta[user.status || 'active'].bg} ${sMeta[user.status || 'active'].color} ${sMeta[user.status || 'active'].border}`}>
                                    {(user.status || 'active').toUpperCase()}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-4 space-y-4">
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-4">
                                <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider border-b border-white/5 pb-2">Profile & Identity</h3>
                                <div className="space-y-3 text-xs">
                                    <div><span className="text-slate-500 font-medium">NIC</span><p className="text-white font-mono font-bold mt-0.5">{user.nic || "Not Provided"}</p></div>
                                    <div><span className="text-slate-500 font-medium">Joined Date</span><p className="text-white font-medium mt-0.5">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p></div>
                                </div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-4">
                                <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider border-b border-white/5 pb-2">Contact Details</h3>
                                <div className="space-y-3 text-xs">
                                    <div><span className="text-slate-500 font-medium">Phone Number</span><p className="text-white font-bold mt-0.5">{user.phoneNumber || "N/A"}</p></div>
                                    <div><span className="text-slate-500 font-medium">Province</span><p className="text-white font-semibold mt-0.5">{user.province || "N/A"}</p></div>
                                    <div><span className="text-slate-500 font-medium">District</span><p className="text-white font-semibold mt-0.5">{user.district || "N/A"}</p></div>
                                    <div><span className="text-slate-500 font-medium">LGA</span><p className="text-white font-semibold mt-0.5">{user.localGovernmentArea || "N/A"}</p></div>
                                    <div><span className="text-slate-500 font-medium">Address</span><p className="text-white font-medium mt-0.5">{user.address || "N/A"}</p></div>
                                </div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-4">
                                <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider border-b border-white/5 pb-2">Gamification</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                                        <span className="text-[10px] text-slate-500 font-medium">Level</span>
                                        <p className="text-lg font-extrabold text-teal-400 font-mono">Lvl {user.level || 1}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                                        <span className="text-[10px] text-slate-500 font-medium">Points</span>
                                        <p className="text-lg font-extrabold text-slate-200 font-mono">{(user.contributionPoints || 0).toLocaleString()} pts</p>
                                    </div>
                                </div>
                                <div className="text-xs space-y-2">
                                    <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg px-3 py-2">
                                        <span className="text-slate-500">Reports Validated</span><span className="font-bold text-slate-200 font-mono">{user.reportsValidated || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-8 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-slate-300 flex items-center justify-between">
                                    <span>Report History Summary</span><span className="text-xs font-medium text-slate-500">Total: {reportCounts.TOTAL}</span>
                                </h3>
                                <div className="grid grid-cols-5 gap-2 text-center">
                                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg py-2"><p className="text-xs font-semibold text-orange-400">Pending</p><p className="text-base font-extrabold text-orange-200 font-mono mt-0.5">{reportCounts.PENDING}</p></div>
                                    <div className="bg-sky-500/5 border border-sky-500/10 rounded-lg py-2"><p className="text-xs font-semibold text-sky-400">Assigned</p><p className="text-base font-extrabold text-sky-200 font-mono mt-0.5">{reportCounts.ASSIGNED}</p></div>
                                    <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg py-2"><p className="text-xs font-semibold text-cyan-400">Fixing</p><p className="text-base font-extrabold text-cyan-200 font-mono mt-0.5">{reportCounts.FIXING}</p></div>
                                    <div className="bg-teal-500/5 border border-teal-500/10 rounded-lg py-2"><p className="text-xs font-semibold text-teal-400">Resolved</p><p className="text-base font-extrabold text-teal-200 font-mono mt-0.5">{reportCounts.RESOLVED}</p></div>
                                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg py-2"><p className="text-xs font-semibold text-rose-400">Rejected</p><p className="text-base font-extrabold text-rose-200 font-mono mt-0.5">{reportCounts.REJECTED}</p></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-300">Submitted Reports List</h3>
                                {loadingReports ? (
                                    <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-white/[0.02] border border-white/5 rounded-xl"><div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-teal-400 animate-spin" /><p className="text-xs text-slate-500 font-medium">Retrieving submitted reports...</p></div>
                                ) : userReports.length === 0 ? (
                                    <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-xl space-y-1"><p className="text-sm text-slate-400 font-bold">No reports submitted</p></div>
                                ) : (
                                    <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                                        {userReports.map((report) => {
                                            const cat = getCategoryDetails(report.categoryId);
                                            const rStatus = reportStatusMeta[report.status] || { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", label: report.status };
                                            return (
                                                <div key={report.id} className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-xl p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4 group">
                                                    <div className="space-y-1.5">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${cat.bg} ${cat.color}`}><span>{cat.icon}</span><span>{cat.label}</span></span>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${rStatus.bg} ${rStatus.color} ${rStatus.border}`}>{rStatus.label.toUpperCase()}</span>
                                                            <span className="text-[10px] text-slate-500 font-semibold font-mono">{report.id}</span>
                                                        </div>
                                                        <h4 className="text-xs font-bold text-white group-hover:text-teal-400 transition-colors line-clamp-1">{report.title}</h4>
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
                <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between gap-4">
                    {onStatusUpdate ? (
                        <button onClick={() => onStatusUpdate(user.uid, user.status || 'active')} className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${(user.status || 'active') === "suspended" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                            {(user.status || 'active') === "suspended" ? "Unsuspend User Account" : "Suspend User Account"}
                        </button>
                    ) : <div />}
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors cursor-pointer">Close Details</button>
                </div>
            </div>
        </div>
    );
}

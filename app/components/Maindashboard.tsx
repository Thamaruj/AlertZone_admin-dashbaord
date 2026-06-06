"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import logo1 from "../assets/logo1.png";
import ReportsManagement from "./Reportsmanagement";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("./Mapview"), { ssr: false });
import Users from "./Users";
import Analytics from "./Analytics";
import Notifications from "./Notifications";
import Settings from "./Settings";
import AdminUserManagement from "./AdminUserManagement";
import { useAuth } from "@/lib/hooks/useAuth";
import Dashboard from "./Dashboard";
import { Report } from "@/lib/types/report";


// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = { label: string; icon: React.ReactNode; id: string };

// ─── AlertZone Logo ───────────────────────────────────────────────────────────

function AlertZoneLogo({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
            <path d="M36 6 L50 28 L36 22 L22 28 Z" fill="#2dd4bf" opacity="0.95" />
            <path d="M18 34 L36 22 L32 42 L16 46 Z" fill="#14b8a6" opacity="0.9" />
            <path d="M54 34 L36 22 L40 42 L56 46 Z" fill="#0d9488" opacity="0.9" />
            <path d="M32 42 L40 42 L44 60 L36 56 L28 60 Z" fill="#2dd4bf" opacity="0.85" />
        </svg>
    );
}

// ─── Stat Card (kept for potential future reuse) ─────────────────────────────

// Note: StatCard kept as a utility in case other views need it.
function _StatCard_UNUSED({ icon, label, value, trend, trendType }: {
    icon: React.ReactNode; label: string; value: string; trend: string;
    trendType?: "up" | "down" | "neutral";
}) {
    const trendStyles =
        trendType === "down" ? "text-teal-300 bg-teal-500/10" :
            trendType === "up" ? "text-orange-300 bg-orange-500/10" :
                "text-slate-400 bg-white/5";
    return (
        <div className="group bg-[#0f2233]/80 backdrop-blur-md border border-white/5 border-t-white/10 rounded-xl p-4 flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(20,184,166,0.15)] hover:border-teal-500/30">
            <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:text-teal-400 group-hover:bg-white/10">
                    {icon}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${trendStyles}`}>
                    {trend}
                </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">{label}</p>
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400 tracking-tight">{value}</p>
        </div>
    );
}
_StatCard_UNUSED;

function DonutChart_UNUSED() {
    const total = 1284, solved = 537, closed = 100, inProgress = 215, reported = 432;
    const cx = 80, cy = 80, r = 54, sw = 16;
    const circ = 2 * Math.PI * r;
    const dSol = circ * (solved / total);
    const dClo = circ * (closed / total);
    const dProg = circ * (inProgress / total);
    const dRep = circ * (reported / total);
    return (
        <div className="flex items-center gap-5">
            <svg width="160" height="160" viewBox="0 0 160 160">
                {/* track */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff08" strokeWidth={sw} />
                {/* solved – teal */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2dd4bf" strokeWidth={sw}
                    strokeDasharray={`${dSol} ${circ - dSol}`} strokeDashoffset={0}
                    transform={`rotate(-90 ${cx} ${cy})`} />
                {/* closed – slate */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#64748b" strokeWidth={sw}
                    strokeDasharray={`${dClo} ${circ - dClo}`} strokeDashoffset={-dSol}
                    transform={`rotate(-90 ${cx} ${cy})`} />
                {/* in-progress – cyan */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#06b6d4" strokeWidth={sw}
                    strokeDasharray={`${dProg} ${circ - dProg}`} strokeDashoffset={-(dSol + dClo)}
                    transform={`rotate(-90 ${cx} ${cy})`} />
                {/* reported – orange */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f97316" strokeWidth={sw}
                    strokeDasharray={`${dRep} ${circ - dRep}`} strokeDashoffset={-(dSol + dClo + dProg)}
                    transform={`rotate(-90 ${cx} ${cy})`} />
                <text x={cx} y={cy - 5} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">TOTAL</text>
                <text x={cx} y={cy + 13} textAnchor="middle" fontWeight="700" fontSize="18" fill="#e2e8f0">
                    {total.toLocaleString()}
                </text>
            </svg>
            <div className="space-y-2 text-xs">
                {[
                    { label: "Solved", color: "bg-teal-400" },
                    { label: "Closed", color: "bg-slate-400" },
                    { label: "In Progress", color: "bg-cyan-400" },
                    { label: "Reported", color: "bg-orange-400" },
                ].map((l) => (
                    <div key={l.label} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${l.color} flex-shrink-0`} />
                        <span className="text-slate-400">{l.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// (Legacy BarChart and LineChart removed — replaced by live Dashboard component)

// (Legacy StatCard removed — replaced by live Dashboard component)

function NavLink({ item, active, badgeCount, onClick }: { item: NavItem; active: boolean; badgeCount?: number; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-300 text-left outline-none border cursor-pointer ${active
                ? "bg-gradient-to-r from-teal-500/10 to-teal-500/[0.01] border-teal-500/25 text-teal-300 shadow-[0_4px_12px_rgba(45,212,191,0.03)]"
                : "border-transparent text-slate-400 hover:bg-white/[0.02] hover:border-white/5 hover:text-slate-200"
                }`}
        >
            {/* Left indicator bar */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.75 rounded-r-full bg-gradient-to-b from-teal-400 to-cyan-500 transition-all duration-300 ${active ? "h-6 opacity-100 shadow-[0_0_10px_rgba(45,212,191,0.6)]" : "h-0 opacity-0"
                }`} />

            {/* Icon container */}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${active
                ? "bg-teal-500/15 border border-teal-500/30 text-teal-400 scale-105"
                : "bg-white/5 border border-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300 group-hover:border-white/10"
                }`}>
                {item.icon}
            </div>

            {/* Label */}
            <span className={`flex-1 transition-all duration-300 ${active ? "translate-x-0.5 text-white" : "group-hover:translate-x-1"
                }`}>{item.label}</span>

            {badgeCount !== undefined && badgeCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e] mr-1" />
            )}
        </button>
    );
}

// ─── Dashboard Overview Content ───────────────────────────────────────────────
// Replaced by the new live <Dashboard /> component — imported from ./Dashboard

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const { user, isSuperAdmin, logout } = useAuth();
    const [activeNav, setActiveNav] = useState("dashboard");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [unreadCount, setUnreadCount] = useState(0);
    const [activeToast, setActiveToast] = useState<Report | null>(null);
    const mountedTime = useRef(new Date());
    const shownReportIds = useRef<Set<string>>(new Set());

    // ── Poller 1: Unread notification badge count ─────────────────────────────
    // Polls /api/notifications/recent (Admin SDK) every 5s for the unread count.
    // Direct Firestore client SDK reads are blocked because request.auth == null in rules.
    useEffect(() => {
        const pollBadge = async () => {
            try {
                const res = await fetch("/api/notifications/recent", { credentials: "include" });
                if (!res.ok) return;
                const data = await res.json();
                if (typeof data.unreadCount === "number") {
                    setUnreadCount(data.unreadCount);
                }
            } catch { /* non-critical */ }
        };
        pollBadge();
        const interval = setInterval(pollBadge, 5000);
        return () => clearInterval(interval);
    }, []);

    // ── Poller 2: New report toast detector ───────────────────────────────────
    // Polls /api/reports?since=<mountTime> every 5s.
    // When a report created AFTER the dashboard mounted is found (and not yet shown),
    // it fires the bottom-right toast popup. This runs independently of notifications
    // so it works even if no admin notification document exists for the new report.
    useEffect(() => {
        // Give the page 3 seconds to settle before watching for new reports,
        // so we don't toast on reports that existed before the admin logged in.
        const startTime = new Date(mountedTime.current.getTime() + 3000).toISOString();

        const pollNewReports = async () => {
            try {
                const res = await fetch(
                    `/api/reports?since=${encodeURIComponent(startTime)}`,
                    { credentials: "include" }
                );
                if (!res.ok) return;
                const data = await res.json();
                const newReports: Report[] = data.reports ?? [];

                for (const report of newReports) {
                    if (shownReportIds.current.has(report.id)) continue;
                    shownReportIds.current.add(report.id);
                    // Show only the most recent new report as a toast
                    setActiveToast(report);
                    // Only show one toast at a time — break after the first new one
                    break;
                }
            } catch { /* non-critical */ }
        };

        // First poll after 5 seconds (let the page settle), then every 5 seconds
        let intervalId: ReturnType<typeof setInterval> | null = null;
        const timerId = setTimeout(() => {
            pollNewReports();
            intervalId = setInterval(pollNewReports, 5000);
        }, 5000);

        return () => {
            clearTimeout(timerId);
            if (intervalId !== null) clearInterval(intervalId);
        };
    }, []);


    const handleToastClick = (report: Report) => {
        if (typeof window !== "undefined") {
            (window as any).pendingReportDetail = report;
            setActiveNav("reports");
            window.dispatchEvent(new CustomEvent("changeNavTab", { detail: "reports" }));
            window.dispatchEvent(new CustomEvent("openReportDetail", { detail: { report } }));
            setActiveToast(null);
        }
    };

    // Derive initials from displayName for the avatar
    const initials = user?.displayName
        ? user.displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
        : "AD";

    // Simulated initial load for the whole dashboard
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    // Listen to tab change events
    useEffect(() => {
        const handleTabChange = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (customEvent.detail) {
                setActiveNav(customEvent.detail);
            }
        };
        window.addEventListener("changeNavTab", handleTabChange);
        return () => window.removeEventListener("changeNavTab", handleTabChange);
    }, []);

    const baseNavItems: NavItem[] = [
        {
            id: "dashboard", label: "Dashboard",
            icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" /><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" /><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" /><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" /></svg>,
        },
        {
            id: "reports", label: "Reports Management",
            icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        },
        {
            id: "map", label: "Map View",
            icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
        },
        {
            id: "users", label: "Users",
            icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        },
        {
            id: "analytics", label: "Analytics",
            icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        },
        {
            id: "notifications", label: "Notifications",
            icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
        },
        {
            id: "settings", label: "Settings",
            icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth="2" /></svg>,
        },
    ];

    // Superadmin-only: Admin Users management tab
    const navItems: NavItem[] = isSuperAdmin
        ? [
            ...baseNavItems,
            {
                id: "admin-users",
                label: "Admin Users",
                icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
            },
        ]
        : baseNavItems;

    return (
        <div className="flex h-screen overflow-hidden bg-[#0d1f2d] relative font-sans">
            <style>{`
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up {
                    opacity: 0;
                    animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .stagger-1 { animation-delay: 100ms; }
                .stagger-2 { animation-delay: 200ms; }
                .stagger-3 { animation-delay: 300ms; }
            `}</style>

            {/* ── Background glows (from login page) ── */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a26] via-[#0d2233] to-[#0a2a2a] opacity-90 pointer-events-none" />
            <div className="absolute top-[-20%] left-[-5%] w-[600px] h-[600px] rounded-full bg-teal-900/20 blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
            <aside className={`fixed md:relative z-30 h-full w-56 flex-shrink-0 bg-[#0f2233] md:bg-[#0f2233]/90 backdrop-blur-2xl border-r border-white/10 flex flex-col transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                {/* Brand */}
                <div className="px-5 py-5 flex items-center gap-3.5 border-b border-white/5 bg-white/[0.01]">
                    <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <Image src={logo1} alt="AlertZone Logo" width={44} height={44} sizes="44px" className="object-contain w-full h-full" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-xl tracking-wide font-sans leading-tight">
                            <span className="text-white">Alert</span><span className="text-teal-400">Zone</span>
                        </span>
                        <span className="text-[10px] text-teal-400/80 font-bold uppercase tracking-widest font-mono mt-0.5">Admin Dashboard</span>
                    </div>
                </div>

                {/* Nav divided into premium semantic groups */}
                <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto premium-sidebar-scroll">
                    {/* Main Section */}
                    <div className="space-y-1.5">
                        <span className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">Overview</span>
                        {navItems.filter(item => ["dashboard", "map"].includes(item.id)).map((item) => (
                            <NavLink key={item.id} item={item} active={activeNav === item.id} badgeCount={item.id === "notifications" ? unreadCount : undefined} onClick={() => { setActiveNav(item.id); setIsMobileMenuOpen(false); }} />
                        ))}
                    </div>

                    {/* Operations / Management */}
                    <div className="space-y-1.5">
                        <span className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">Management</span>
                        {navItems.filter(item => ["reports", "users", "notifications", "analytics"].includes(item.id)).map((item) => (
                            <NavLink key={item.id} item={item} active={activeNav === item.id} badgeCount={item.id === "notifications" ? unreadCount : undefined} onClick={() => { setActiveNav(item.id); setIsMobileMenuOpen(false); }} />
                        ))}
                    </div>

                    {/* System Section */}
                    <div className="space-y-1.5">
                        <span className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">System</span>
                        {navItems.filter(item => ["admin-users", "settings"].includes(item.id)).map((item) => (
                            <NavLink key={item.id} item={item} active={activeNav === item.id} badgeCount={item.id === "notifications" ? unreadCount : undefined} onClick={() => { setActiveNav(item.id); setIsMobileMenuOpen(false); }} />
                        ))}
                    </div>
                </nav>

                {/* Admin profile + Logout at bottom of sidebar */}
                <div className="px-3 py-4 border-t border-white/5 bg-white/[0.01] space-y-2">
                    {/* Admin profile card */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-teal-900/40 select-none flex-shrink-0 overflow-hidden">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">{user?.displayName ?? "Admin"}</p>
                            <p className="text-[10px] text-teal-400/80 font-medium">
                                {user?.role === "superadmin" ? "Super Admin" : "Admin"}
                            </p>
                        </div>
                    </div>

                    {/* Sign Out button */}
                    <button
                        id="sidebar-logout-btn"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 text-left"
                    >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ── Main ────────────────────────────────────────────────────────────── */}
            <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Topbar — mobile menu toggle only; profile lives in sidebar */}
                <header className="md:hidden bg-[#0f2233]/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                    <button
                        className="p-2 -ml-2 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="text-sm font-semibold text-slate-200">
                        {navItems.find(n => n.id === activeNav)?.label ?? "Dashboard"}
                    </span>
                </header>

                {/* ── Scrollable page ── */}
                <main className={`flex-1 overflow-y-auto ${activeNav === 'map' ? 'md:flex md:flex-col md:overflow-hidden p-4 md:p-0' : 'px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5'}`}>

                    {/* Section Content based on active navigation */}
                    {loading ? (
                        <div className="flex flex-col gap-6 animate-pulse">
                            <div className="h-10 bg-white/5 rounded-lg w-1/3" />
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}
                            </div>
                            <div className="h-64 bg-white/5 rounded-xl" />
                        </div>
                    ) : (
                        <>
                            {activeNav === "dashboard" && <Dashboard onNavigate={setActiveNav} />}
                            {activeNav === "reports" && <ReportsManagement />}
                            {activeNav === "map" && <MapView />}
                            {activeNav === "users" && <Users />}
                            {activeNav === "analytics" && <Analytics />}
                            {activeNav === "notifications" && <Notifications />}
                            {/* Superadmin only */}
                            {activeNav === "admin-users" && isSuperAdmin && <AdminUserManagement />}
                            {activeNav === "settings" && <Settings />}
                        </>
                    )}

                    {/* Footer */}
                    <p className={`text-center text-[11px] text-slate-400 pb-2 mt-auto flex-shrink-0 ${activeNav === 'map' ? 'md:hidden' : ''}`}>
                        © 2026 AlertZone Municipal Infrastructure. All Rights Reserved.
                    </p>
                </main>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowLogoutConfirm(false)}
                    />

                    {/* Modal Content Card */}
                    <div className="relative bg-[#0f2233] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl shadow-black/85 animate-in fade-in zoom-in-95 duration-200 z-10">
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />

                        <div className="flex flex-col items-center text-center">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 shadow-inner shadow-red-900/10">
                                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>

                            {/* Header */}
                            <h3 className="text-base font-bold text-slate-100 tracking-wide mb-2">
                                Confirm Sign Out
                            </h3>

                            {/* Message */}
                            <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                Are you sure you want to sign out of the AlertZone Administration Portal? You will need to enter your credentials to log in again.
                            </p>

                            {/* Buttons */}
                            <div className="flex w-full gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-slate-200 hover:border-white/20 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white text-xs font-semibold py-2 rounded-xl transition-all duration-200 shadow-md shadow-red-950/40 hover:shadow-red-900/50"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Real-time New Issue Toast Notification */}
            {activeToast && (
                <div
                    onClick={() => handleToastClick(activeToast)}
                    className="fixed bottom-6 right-6 z-[120] w-full max-w-sm bg-[#0f2233]/95 backdrop-blur-2xl border border-teal-500/30 hover:border-teal-500/60 rounded-2xl p-4 shadow-[0_10px_40px_rgba(20,184,166,0.15)] animate-in fade-in slide-in-from-bottom-5 duration-300 cursor-pointer group"
                >
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            📢
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">New Issue Received</h4>
                            <p className="text-sm font-semibold text-white mt-1 group-hover:text-teal-300 transition-colors">
                                {activeToast.category} Incident
                            </p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                {activeToast.description}
                            </p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveToast(null);
                            }}
                            className="flex-shrink-0 p-1 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
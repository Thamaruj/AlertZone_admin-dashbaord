"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = { label: string; icon: React.ReactNode; id: string };
type Report = {
    id: string;
    category: "Fire" | "Medical" | "Accident" | "Theft";
    location: string;
    time: string;
    status: "Dispatched" | "Unassigned" | "Resolved" | "Investigating";
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const REPORTS: Report[] = [
    { id: "#REP-8284", category: "Fire", location: "122 Baker St. NW", time: "3 mins ago", status: "Dispatched" },
    { id: "#REP-8283", category: "Medical", location: "Grand Central Station", time: "14 mins ago", status: "Unassigned" },
    { id: "#REP-8292", category: "Accident", location: "Highway 401, Exit 4", time: "45 mins ago", status: "Resolved" },
    { id: "#REP-8281", category: "Theft", location: "Silicon Valley Plaza", time: "1 hour ago", status: "Investigating" },
];

const MONTHLY_DATA = [
    { month: "Jan", y2024: 30, y2025: 20 },
    { month: "Feb", y2024: 45, y2025: 30 },
    { month: "Mar", y2024: 35, y2025: 50 },
    { month: "Apr", y2024: 50, y2025: 40 },
    { month: "May", y2024: 40, y2025: 60 },
    { month: "Jun", y2024: 55, y2025: 55 },
    { month: "Jul", y2024: 45, y2025: 70 },
    { month: "Aug", y2024: 60, y2025: 80 },
    { month: "Sep", y2024: 50, y2025: 75 },
    { month: "Oct", y2024: 65, y2025: 85 },
    { month: "Nov", y2024: 55, y2025: 90 },
    { month: "Dec", y2024: 70, y2025: 95 },
];

const BAR_DATA = [
    { label: "Fire", value: 180, color: "#f97316" },
    { label: "Medical", value: 250, color: "#2dd4bf" },
    { label: "Theft", value: 140, color: "#06b6d4" },
    { label: "Flood", value: 90, color: "#0d9488" },
    { label: "Accident", value: 210, color: "#14b8a6" },
    { label: "Other", value: 70, color: "#334155" },
];

// ─── Category / Status Meta ───────────────────────────────────────────────────

const categoryMeta: Record<Report["category"], { color: string; bg: string; icon: string }> = {
    Fire: { color: "text-orange-400", bg: "bg-orange-500/10", icon: "🔥" },
    Medical: { color: "text-teal-300", bg: "bg-teal-500/10", icon: "🏥" },
    Accident: { color: "text-cyan-300", bg: "bg-cyan-500/10", icon: "🚗" },
    Theft: { color: "text-rose-400", bg: "bg-rose-500/10", icon: "🔓" },
};

const statusMeta: Record<Report["status"], { color: string; bg: string; dot: string }> = {
    Dispatched: { color: "text-orange-300", bg: "bg-orange-500/10", dot: "bg-orange-400" },
    Unassigned: { color: "text-yellow-300", bg: "bg-yellow-500/10", dot: "bg-yellow-400" },
    Resolved: { color: "text-teal-300", bg: "bg-teal-500/10", dot: "bg-teal-400" },
    Investigating: { color: "text-cyan-300", bg: "bg-cyan-500/10", dot: "bg-cyan-400" },
};

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

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart() {
    const total = 1284, resolved = 637, inProgress = 215, reported = 432;
    const cx = 80, cy = 80, r = 54, sw = 16;
    const circ = 2 * Math.PI * r;
    const dRes = circ * (resolved / total);
    const dProg = circ * (inProgress / total);
    const dRep = circ * (reported / total);
    return (
        <div className="flex items-center gap-5">
            <svg width="160" height="160" viewBox="0 0 160 160">
                {/* track */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff08" strokeWidth={sw} />
                {/* resolved – teal */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2dd4bf" strokeWidth={sw}
                    strokeDasharray={`${dRes} ${circ - dRes}`} strokeDashoffset={0}
                    transform={`rotate(-90 ${cx} ${cy})`} />
                {/* in-progress – cyan */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#06b6d4" strokeWidth={sw}
                    strokeDasharray={`${dProg} ${circ - dProg}`} strokeDashoffset={-(circ - (circ - dRes))}
                    transform={`rotate(-90 ${cx} ${cy})`} />
                {/* reported – orange */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f97316" strokeWidth={sw}
                    strokeDasharray={`${dRep} ${circ - dRep}`} strokeDashoffset={-(circ - (circ - dRes - dProg))}
                    transform={`rotate(-90 ${cx} ${cy})`} />
                <text x={cx} y={cy - 5} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">TOTAL</text>
                <text x={cx} y={cy + 13} textAnchor="middle" fontWeight="700" fontSize="18" fill="#e2e8f0">
                    {total.toLocaleString()}
                </text>
            </svg>
            <div className="space-y-2.5 text-xs">
                {[
                    { label: "Resolved", color: "bg-teal-400" },
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

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart() {
    const max = Math.max(...BAR_DATA.map((d) => d.value));
    return (
        <div className="flex items-end gap-3 px-1" style={{ height: 148 }}>
            {BAR_DATA.map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="w-full flex items-end justify-center" style={{ height: 120 }}>
                        <div
                            className="w-full rounded-t-sm transition-all duration-700"
                            style={{
                                height: `${(d.value / max) * 115}px`,
                                backgroundColor: d.color,
                                opacity: 0.8,
                                boxShadow: `0 -2px 8px ${d.color}44`,
                            }}
                        />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function LineChart() {
    const W = 560, H = 120;
    const pad = { l: 8, r: 8, t: 8, b: 8 };
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;
    const maxVal = 100;
    const toX = (i: number) => pad.l + (i / (MONTHLY_DATA.length - 1)) * iW;
    const toY = (v: number) => pad.t + iH - (v / maxVal) * iH;
    const pathD = (key: "y2024" | "y2025") =>
        MONTHLY_DATA.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d[key])}`).join(" ");
    const areaD = (key: "y2024" | "y2025") =>
        `${pathD(key)} L ${toX(MONTHLY_DATA.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 120 }}>
            <defs>
                <linearGradient id="lgTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lgSlate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#475569" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#475569" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaD("y2024")} fill="url(#lgSlate)" />
            <path d={areaD("y2025")} fill="url(#lgTeal)" />
            <path d={pathD("y2024")} fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="5 3" />
            <path d={pathD("y2025")} fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, trend, trendType }: {
    icon: React.ReactNode; label: string; value: string; trend: string;
    trendType?: "up" | "down" | "neutral";
}) {
    const trendStyles =
        trendType === "down" ? "text-teal-300 bg-teal-500/10" :
            trendType === "up" ? "text-orange-300 bg-orange-500/10" :
                "text-slate-400 bg-white/5";
    return (
        <div className="bg-[#0f2233]/80 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col gap-2 hover:border-teal-500/20 transition-all duration-200">
            <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                    {icon}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${trendStyles}`}>
                    {trend}
                </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
            <p className="text-2xl font-bold text-slate-100 tracking-tight">{value}</p>
        </div>
    );
}

// ─── Nav Link ─────────────────────────────────────────────────────────────────

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${active
                    ? "bg-teal-500/15 text-teal-400 border border-teal-500/20"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
        >
            <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
        </button>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const [activeNav, setActiveNav] = useState("dashboard");
    const [searchValue, setSearchValue] = useState("");

    const navItems: NavItem[] = [
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

    return (
        <div className="flex h-screen overflow-hidden bg-[#0d1f2d] relative font-sans">

            {/* ── Background glows (from login page) ── */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a26] via-[#0d2233] to-[#0a2a2a] opacity-90 pointer-events-none" />
            <div className="absolute top-[-20%] left-[-5%] w-[600px] h-[600px] rounded-full bg-teal-900/20 blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />

            {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
            <aside className="relative z-10 w-56 flex-shrink-0 bg-[#0f2233]/80 backdrop-blur-xl border-r border-white/5 flex flex-col">
                {/* Brand */}
                <div className="px-4 py-5 flex items-center gap-2.5 border-b border-white/5">
                    <AlertZoneLogo size={28} />
                    <span className="text-white font-bold text-sm tracking-wide">AlertZone</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink key={item.id} item={item} active={activeNav === item.id} onClick={() => setActiveNav(item.id)} />
                    ))}
                </nav>

                {/* User */}
                <div className="px-3 py-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            AM
                        </div>
                        <div className="min-w-0">
                            <p className="text-slate-200 text-xs font-semibold truncate">Alex Morgan</p>
                            <p className="text-slate-500 text-[10px] truncate">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main ────────────────────────────────────────────────────────────── */}
            <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Topbar */}
                <header className="bg-[#0f2233]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center gap-4 flex-shrink-0">
                    {/* Search */}
                    <div className="flex-1 max-w-md relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search reports, users or locations..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all duration-200"
                        />
                    </div>

                    {/* Right profile block */}
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="flex items-center gap-2.5">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-semibold text-slate-300">Alex Morgan</p>
                                <p className="text-[10px] text-slate-500">Super Admin</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-teal-900/40">
                                AM
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Scrollable page ── */}
                <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Page heading */}
                    <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-lg font-bold text-slate-100 tracking-tight">Dashboard Overview</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Real-time emergency monitoring and response status.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                <svg className="w-3.5 h-3.5 text-teal-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Last 30 Days
                            </div>
                            <button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg shadow-teal-900/40 transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                                Create Report
                            </button>
                        </div>
                    </div>

                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={<svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                            label="Total Reports" value="1,284" trend="+10% from last month" trendType="up"
                        />
                        <StatCard
                            icon={<svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                            label="Reported" value="432" trend="-9% now stable" trendType="down"
                        />
                        <StatCard
                            icon={<svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                            label="In Progress" value="215" trend="Stable trend" trendType="neutral"
                        />
                        <StatCard
                            icon={<svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            label="Resolved" value="637" trend="+54% interactive" trendType="down"
                        />
                    </div>

                    {/* ── Charts Row ── */}
                    <div className="bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-xl p-5 hover:border-teal-500/10 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-200">Incidents by Category</h2>
                            <button className="text-slate-600 hover:text-slate-400 transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-start justify-between gap-6 flex-wrap">
                            <div className="flex-1 min-w-[200px]"><BarChart /></div>
                            <div className="flex-shrink-0"><DonutChart /></div>
                        </div>
                    </div>

                    {/* ── Monthly Trend ── */}
                    <div className="bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-xl p-5 hover:border-teal-500/10 transition-colors">
                        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-200">Monthly Trend</h2>
                                <p className="text-[11px] text-slate-500 mt-0.5">Incident volume over the current year</p>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-6 h-0.5 bg-teal-400 rounded inline-block" />2025
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-5 border-t border-dashed border-slate-600 inline-block" />2024
                                </span>
                            </div>
                        </div>
                        <LineChart />
                        <div className="flex justify-between px-1 mt-1.5">
                            {MONTHLY_DATA.map((d) => (
                                <span key={d.month} className="text-[9px] text-slate-600 font-mono">{d.month}</span>
                            ))}
                        </div>
                    </div>

                    {/* ── Recent Reports ── */}
                    <div className="bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden hover:border-teal-500/10 transition-colors">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
                            <h2 className="text-sm font-semibold text-slate-200">Recent Reports</h2>
                            <button className="text-xs text-teal-400 font-semibold hover:text-teal-300 transition-colors">
                                View All
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[580px]">
                                <thead>
                                    <tr className="bg-white/3 text-slate-600 font-semibold uppercase tracking-wide text-[10px] border-b border-white/5">
                                        <th className="px-5 py-3 text-left">Incident ID</th>
                                        <th className="px-5 py-3 text-left">Category</th>
                                        <th className="px-5 py-3 text-left">Location</th>
                                        <th className="px-5 py-3 text-left">Time</th>
                                        <th className="px-5 py-3 text-left">Status</th>
                                        <th className="px-5 py-3 text-left">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {REPORTS.map((r) => {
                                        const cat = categoryMeta[r.category];
                                        const st = statusMeta[r.status];
                                        return (
                                            <tr key={r.id} className="hover:bg-white/3 transition-colors group">
                                                <td className="px-5 py-3.5 font-mono font-semibold text-teal-400/80">{r.id}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cat.bg} ${cat.color} border border-white/5`}>
                                                        <span>{cat.icon}</span>{r.category}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-400">{r.location}</td>
                                                <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">{r.time}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.bg} ${st.color} border border-white/5`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <button className="text-slate-600 hover:text-teal-400 transition-colors group-hover:text-slate-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-[11px] text-slate-600 pb-2">
                        © 2026 AlertZone Municipal Infrastructure. All Rights Reserved.
                    </p>
                </main>
            </div>
        </div>
    );
}
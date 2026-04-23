"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import logo1 from "../assets/logo1.png";
import ReportsManagement from "./Reportsmanagement";
import MapView from "./Mapview";
import Users from "./Users";
import Analytics from "./Analytics";


// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = { label: string; icon: React.ReactNode; id: string };
type Report = {
    id: string;
    category: "Hazard" | "Lighting" | "Waste" | "Roads" | "Water" | "Safety";
    location: string;
    time: string;
    status: "Reported" | "In Progress" | "Solved" | "Closed";
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const REPORTS: Report[] = [
    { id: "#REP-8284", category: "Hazard", location: "122 Baker St. NW", time: "3 mins ago", status: "In Progress" },
    { id: "#REP-8283", category: "Lighting", location: "Grand Central Station", time: "14 mins ago", status: "Reported" },
    { id: "#REP-8292", category: "Roads", location: "Highway 401, Exit 4", time: "45 mins ago", status: "Solved" },
    { id: "#REP-8281", category: "Waste", location: "Silicon Valley Plaza", time: "1 hour ago", status: "Closed" },
];

const MONTHLY_DATA = [
    { month: "Jan", y2025: 30, y2026: 20 },
    { month: "Feb", y2025: 45, y2026: 30 },
    { month: "Mar", y2025: 35, y2026: 50 },
    { month: "Apr", y2025: 50, y2026: 40 },
    { month: "May", y2025: 40, y2026: 60 },
    { month: "Jun", y2025: 55, y2026: 55 },
    { month: "Jul", y2025: 45, y2026: 70 },
    { month: "Aug", y2025: 60, y2026: 80 },
    { month: "Sep", y2025: 50, y2026: 75 },
    { month: "Oct", y2025: 65, y2026: 85 },
    { month: "Nov", y2025: 55, y2026: 90 },
    { month: "Dec", y2025: 70, y2026: 95 },
];

const BAR_DATA = [
    { label: "Hazard", value: 234, color: "#f43f5e", breakdown: { reported: 80, inProgress: 34, solved: 100, closed: 20 } },
    { label: "Lighting", value: 250, color: "#eab308", breakdown: { reported: 90, inProgress: 60, solved: 90, closed: 10 } },
    { label: "Waste", value: 140, color: "#22c55e", breakdown: { reported: 40, inProgress: 20, solved: 70, closed: 10 } },
    { label: "Roads", value: 190, color: "#3b82f6", breakdown: { reported: 60, inProgress: 50, solved: 70, closed: 10 } },
    { label: "Water", value: 210, color: "#0ea5e9", breakdown: { reported: 72, inProgress: 38, solved: 80, closed: 20 } },
    { label: "Safety", value: 260, color: "#8b5cf6", breakdown: { reported: 90, inProgress: 13, solved: 127, closed: 30 } },
];

// ─── Category / Status Meta ───────────────────────────────────────────────────

const categoryMeta: Record<Report["category"], { color: string; bg: string; icon: string }> = {
    Hazard: { color: "text-rose-400", bg: "bg-rose-500/10", icon: "⚠️" },
    Lighting: { color: "text-yellow-400", bg: "bg-yellow-500/10", icon: "💡" },
    Waste: { color: "text-green-400", bg: "bg-green-500/10", icon: "🗑️" },
    Roads: { color: "text-blue-400", bg: "bg-blue-500/10", icon: "🚧" },
    Water: { color: "text-sky-400", bg: "bg-sky-500/10", icon: "💧" },
    Safety: { color: "text-violet-400", bg: "bg-violet-500/10", icon: "🛡️" },
};

const statusMeta: Record<Report["status"], { color: string; bg: string; dot: string }> = {
    Reported: { color: "text-orange-300", bg: "bg-orange-500/10", dot: "bg-orange-400" },
    "In Progress": { color: "text-cyan-300", bg: "bg-cyan-500/10", dot: "bg-cyan-400" },
    Solved: { color: "text-teal-300", bg: "bg-teal-500/10", dot: "bg-teal-400" },
    Closed: { color: "text-slate-400", bg: "bg-slate-500/10", dot: "bg-slate-400" },
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

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart() {
    const max = Math.max(...BAR_DATA.map((d) => d.value));
    return (
        <div className="flex items-end gap-3 px-1" style={{ height: 148 }}>
            {BAR_DATA.map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-1.5 flex-1 relative group">
                    <span className="text-[10px] font-bold text-slate-200 opacity-70 group-hover:opacity-100 transition-opacity duration-300 -mb-1">
                        {d.value}
                    </span>
                    <div className="w-full flex items-end justify-center relative" style={{ height: 100 }}>
                        <div
                            className="w-full rounded-t-sm transition-all duration-700 cursor-pointer hover:brightness-125"
                            style={{
                                height: `${(d.value / max) * 95}px`,
                                backgroundColor: d.color,
                                opacity: 0.85,
                                boxShadow: `0 -2px 8px ${d.color}44`,
                            }}
                        />

                        {/* Custom Hover Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-[#0f2233] border border-white/10 rounded-lg p-2.5 shadow-2xl z-50 pointer-events-none fade-in slide-in-from-bottom-2 animate-in duration-200">
                            <span className="text-xs font-bold text-slate-100 mb-1 border-b border-white/5 pb-1 line-clamp-1 truncate" style={{ color: d.color }}>{d.label} Breakdown</span>
                            <div className="flex justify-between items-center text-[10px] py-0.5 min-w-[100px]">
                                <span className="text-orange-400">Reported</span>
                                <span className="font-mono text-slate-200">{d.breakdown.reported}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] py-0.5 min-w-[100px]">
                                <span className="text-cyan-400">In Progress</span>
                                <span className="font-mono text-slate-200">{d.breakdown.inProgress}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] py-0.5 min-w-[100px]">
                                <span className="text-teal-400">Solved</span>
                                <span className="font-mono text-slate-200">{d.breakdown.solved}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] py-0.5 min-w-[100px]">
                                <span className="text-slate-400">Closed</span>
                                <span className="font-mono text-slate-200">{d.breakdown.closed}</span>
                            </div>
                        </div>
                    </div>
                    <span className="text-[9px] text-slate-300 font-mono pt-0.5">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function LineChart() {
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const W = 560, H = 120;
    const pad = { l: 8, r: 8, t: 8, b: 8 };
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;
    const maxVal = 100;
    const toX = (i: number) => pad.l + (i / (MONTHLY_DATA.length - 1)) * iW;
    const toY = (v: number) => pad.t + iH - (v / maxVal) * iH;
    const pathD = (key: "y2025" | "y2026") =>
        MONTHLY_DATA.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d[key])}`).join(" ");
    const areaD = (key: "y2025" | "y2026") =>
        `${pathD(key)} L ${toX(MONTHLY_DATA.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;

    return (
        <div className="relative w-full" style={{ height: 120 }} onMouseLeave={() => setHoverIdx(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
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
                <path d={areaD("y2025")} fill="url(#lgSlate)" />
                <path d={areaD("y2026")} fill="url(#lgTeal)" />
                <path d={pathD("y2025")} fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="5 3" />
                <path d={pathD("y2026")} fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Interaction Overlay mapped to invisible rectangles */}
                {MONTHLY_DATA.map((d, i) => {
                    const xP = toX(i);
                    const isHovered = hoverIdx === i;
                    const bandWidth = iW / (MONTHLY_DATA.length - 1);
                    return (
                        <g key={d.month} onMouseEnter={() => setHoverIdx(i)}>
                            <rect
                                x={xP - bandWidth / 2} y={0} width={bandWidth} height={H}
                                fill="transparent" className="cursor-crosshair"
                            />
                            {isHovered && (
                                <line x1={xP} y1={pad.t} x2={xP} y2={H - pad.b} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" pointerEvents="none" />
                            )}
                            <circle cx={xP} cy={toY(d.y2025)} r={isHovered ? 4 : 0} fill="#0d1f2d" stroke="#475569" strokeWidth="2" pointerEvents="none" className="transition-all duration-200" />
                            <circle cx={xP} cy={toY(d.y2026)} r={isHovered ? 4 : 0} fill="#0d1f2d" stroke="#2dd4bf" strokeWidth="2" pointerEvents="none" className="transition-all duration-200" />
                        </g>
                    );
                })}
            </svg>

            {/* Floating Tooltip */}
            {hoverIdx !== null && (
                <div
                    className="absolute z-50 bg-[#0f2233] border border-white/10 rounded-lg p-2.5 shadow-2xl pointer-events-none fade-in slide-in-from-bottom-2 animate-in duration-200 min-w-[120px]"
                    style={{
                        left: `${(toX(hoverIdx) / W) * 100}%`,
                        top: '10px',
                        transform: 'translateX(calc(-50% + 5px))' // Slight correction for standard centering
                    }}
                >
                    <span className="text-xs font-bold text-slate-100 mb-2 border-b border-white/5 pb-1 block">
                        {MONTHLY_DATA[hoverIdx].month} Trend
                    </span>
                    <div className="flex justify-between items-center text-[10px] py-0.5 gap-4">
                        <span className="flex items-center gap-1.5 text-white"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>2025</span>
                        <span className="font-mono text-slate-300 font-semibold">{MONTHLY_DATA[hoverIdx].y2025}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] py-0.5 gap-4">
                        <span className="flex items-center gap-1.5 text-white"><span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>2026</span>
                        <span className="font-mono text-slate-100 font-bold">{MONTHLY_DATA[hoverIdx].y2026}</span>
                    </div>
                </div>
            )}
        </div>
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

// ─── Nav Link ─────────────────────────────────────────────────────────────────

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${active
                ? "bg-teal-500/15 text-teal-400 border border-teal-500/20"
                : "text-slate-300 hover:bg-white/5 hover:text-slate-300"
                }`}
        >
            <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
        </button>
    );
}

// ─── Dashboard Overview Content ───────────────────────────────────────────────

function DashboardOverviewContent() {
    return (
        <>
            {/* Page heading */}
            <div className="flex items-start justify-between flex-wrap gap-3 animate-slide-up">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-teal-300 tracking-tight pb-1">Dashboard Overview</h1>
                    <p className="text-xs text-slate-300 mt-0.5">Real-time emergency monitoring and response status.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <svg className="w-3.5 h-3.5 text-teal-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Last 30 Days
                    </div>
                    <button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white text-xs font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-lg shadow-teal-900/40 transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Create Report</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 animate-slide-up stagger-1">
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
                    label="Solved" value="537" trend="+40% solved faster" trendType="up"
                />
                <StatCard
                    icon={<svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                    label="Closed" value="100" trend="Archived completely" trendType="neutral"
                />
            </div>

            {/* ── Charts Row ── */}
            <div className="bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-xl p-5 hover:border-teal-500/30 hover:shadow-[0_0_30px_rgb(20,184,166,0.05)] transition-all duration-300 animate-slide-up stagger-2">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-200">Incidents by Category</h2>
                    <button className="text-slate-400 hover:text-slate-400 transition-colors">
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
            <div className="bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-xl p-5 hover:border-teal-500/30 hover:shadow-[0_0_30px_rgb(20,184,166,0.05)] transition-all duration-300 animate-slide-up stagger-3">
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-200">Monthly Trend</h2>
                        <p className="text-[11px] text-slate-300 mt-0.5">Incident volume over the current year</p>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-slate-300">
                        <span className="flex items-center gap-1.5">
                            <span className="w-6 h-0.5 bg-teal-400 rounded inline-block" />2026
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-5 border-t border-dashed border-slate-600 inline-block" />2025
                        </span>
                    </div>
                </div>
                <LineChart />
                <div className="flex justify-between px-1 mt-1.5">
                    {MONTHLY_DATA.map((d) => (
                        <span key={d.month} className="text-[9px] text-slate-400 font-mono">{d.month}</span>
                    ))}
                </div>
            </div>

            {/* ── Recent Reports ── */}
            <div className="bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-xl overflow-hidden hover:border-teal-500/30 hover:shadow-[0_0_30px_rgb(20,184,166,0.05)] transition-all duration-300 animate-slide-up stagger-3">
                <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
                    <h2 className="text-sm font-semibold text-slate-200">Recent Reports</h2>
                    <button className="text-xs text-teal-400 font-semibold hover:text-teal-300 transition-colors">
                        View All
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[580px]">
                        <thead>
                            <tr className="bg-white/3 text-slate-400 font-semibold uppercase tracking-wide text-[10px] border-b border-white/5">
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
                                        <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">{r.time}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.bg} ${st.color} border border-white/5 transition-all outline outline-1 outline-transparent hover:outline-teal-500/30 cursor-default`}>
                                                <span className="relative flex w-1.5 h-1.5">
                                                    {(r.status === "Reported" || r.status === "In Progress") && (
                                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${st.dot}`}></span>
                                                    )}
                                                    <span className={`relative inline-flex rounded-full w-1.5 h-1.5 ${st.dot}`} />
                                                </span>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <button className="text-slate-400 hover:text-teal-400 transition-colors group-hover:text-slate-300">
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
        </>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const [activeNav, setActiveNav] = useState("dashboard");
    const [searchValue, setSearchValue] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Simulated initial load for the whole dashboard
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);


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
            <aside className={`fixed md:relative z-30 h-full w-56 flex-shrink-0 bg-[#0f2233] md:bg-[#0f2233]/80 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                {/* Brand */}
                <div className="px-4 py-5 flex items-center gap-2.5 border-b border-white/5">
                    <Image src={logo1} alt="AlertZone Logo" width={28} height={28} className="object-contain drop-shadow-md" />
                    <span className="text-white font-bold text-sm tracking-wide">AlertZone</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink key={item.id} item={item} active={activeNav === item.id} onClick={() => setActiveNav(item.id)} />
                    ))}
                </nav>

            </aside>

            {/* ── Main ────────────────────────────────────────────────────────────── */}
            <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Topbar */}
                <header className="bg-[#0f2233]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3 flex items-center gap-3 md:gap-4 flex-shrink-0">
                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 -ml-2 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Search */}
                    <div className="flex-1 max-w-md relative group">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500/60 group-focus-within:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search reports..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-14 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-all duration-200"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 opacity-60">
                            <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-slate-300 bg-white/10 border border-white/10 rounded shadow-sm">⌘</kbd>
                            <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-slate-300 bg-white/10 border border-white/10 rounded shadow-sm">K</kbd>
                        </div>
                    </div>

                    {/* Right profile block */}
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="flex items-center gap-2.5">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-semibold text-slate-300">Alex Morgan</p>
                                <p className="text-[10px] text-slate-300">Super Admin</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-teal-900/40">
                                AM
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Scrollable page ── */}
                <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5">

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
                            {activeNav === "dashboard" && <DashboardOverviewContent />}
                            {activeNav === "reports" && <ReportsManagement />}

                            {activeNav === "map" && <MapView />}

                            {activeNav === "users" && <Users />}

                            {activeNav === "analytics" && <Analytics />}

                            {/* Other section placeholders remain same for now */}
                            {["notifications", "settings"].includes(activeNav) && (
                                <div className="flex flex-col items-center justify-center h-full py-20 animate-slide-up">
                                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                        {navItems.find(n => n.id === activeNav)?.label}
                                    </h2>
                                    <p className="text-slate-400 mt-2 text-sm">This section is coming soon.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Footer */}
                    <p className="text-center text-[11px] text-slate-400 pb-2">
                        © 2026 AlertZone Municipal Infrastructure. All Rights Reserved.
                    </p>
                </main>
            </div>
        </div>
    );
}
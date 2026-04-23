"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = "Last 7 Days" | "Last 30 Days" | "Last 90 Days" | "Last Year";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CATEGORY_STATS = [
    { name: "Hazard", count: 234, growth: "+12%", color: "#f43f5e" },
    { name: "Lighting", count: 250, growth: "-5%", color: "#eab308" },
    { name: "Waste", count: 140, growth: "+18%", color: "#22c55e" },
    { name: "Roads", count: 190, growth: "+2%", color: "#3b82f6" },
    { name: "Water", count: 210, growth: "-3%", color: "#0ea5e9" },
    { name: "Safety", count: 260, growth: "+25%", color: "#8b5cf6" },
];

const DAILY_ACTIVITY = [
    { day: "Mon", reports: 45, solved: 38 },
    { day: "Tue", reports: 52, solved: 42 },
    { day: "Wed", reports: 38, solved: 35 },
    { day: "Thu", reports: 65, solved: 55 },
    { day: "Fri", reports: 48, solved: 40 },
    { day: "Sat", reports: 30, solved: 28 },
    { day: "Sun", reports: 25, solved: 22 },
];

const REGIONAL_PERFORMANCE = [
    { region: "North District", reports: 432, avgResolution: "4.2h", satisfaction: 94 },
    { region: "South Side", reports: 312, avgResolution: "5.8h", satisfaction: 88 },
    { region: "West End", reports: 284, avgResolution: "3.5h", satisfaction: 96 },
    { region: "East Coast", reports: 256, avgResolution: "6.1h", satisfaction: 82 },
    { region: "Central Hub", reports: 512, avgResolution: "2.9h", satisfaction: 98 },
];

// ─── Components ───────────────────────────────────────────────────────────────

function AnalyticsStatCard({ label, value, trend, icon, color }: {
    label: string; value: string; trend: { val: string; type: "up" | "down" | "neutral" }; icon: React.ReactNode; color: string;
}) {
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col gap-1 transition-all duration-300 hover:border-teal-500/40 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px] pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400">{label}</span>
                <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${color} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${
                    trend.type === "up" ? "text-emerald-400" : trend.type === "down" ? "text-rose-400" : "text-slate-400"
                }`}>
                    {trend.type === "up" ? "↗" : trend.type === "down" ? "↘" : "→"} {trend.val}
                </span>
            </div>
        </div>
    );
}

function MiniBarChart({ data }: { data: typeof DAILY_ACTIVITY }) {
    const maxVal = Math.max(...data.map(d => d.reports));
    return (
        <div className="flex items-end justify-between h-32 gap-2 px-2">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full flex flex-col items-center gap-1 h-full justify-end">
                        <div 
                            className="w-full max-w-[12px] bg-teal-500/40 rounded-t-sm transition-all duration-500 group-hover:bg-teal-500/60"
                            style={{ height: `${(d.reports / maxVal) * 100}%` }}
                        />
                        <div 
                            className="w-full max-w-[12px] bg-teal-400 rounded-t-sm -mt-full transition-all duration-700 delay-100 group-hover:bg-teal-300"
                            style={{ height: `${(d.solved / maxVal) * 100}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{d.day}</span>
                </div>
            ))}
        </div>
    );
}

export default function Analytics() {
    const [timeRange, setTimeRange] = useState<TimeRange>("Last 30 Days");

    return (
        <div className="space-y-8 animate-slide-up">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Performance Analytics</h1>
                    <p className="text-slate-400 mt-1 text-sm font-medium">Deep dive into municipal response efficiency and community engagement metrics.</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-1">
                    {(["Last 7 Days", "Last 30 Days", "Last 90 Days"] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                timeRange === range 
                                ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" 
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up stagger-1">
                <AnalyticsStatCard 
                    label="Avg. Resolution Time"
                    value="4.8 Hours"
                    trend={{ val: "12% faster", type: "up" }}
                    color="text-emerald-400"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <AnalyticsStatCard 
                    label="Citizen Satisfaction"
                    value="92.4%"
                    trend={{ val: "+2.1% growth", type: "up" }}
                    color="text-amber-400"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <AnalyticsStatCard 
                    label="Active Reporters"
                    value="2,482"
                    trend={{ val: "8% increase", type: "up" }}
                    color="text-cyan-400"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                />
                <AnalyticsStatCard 
                    label="Resolved Today"
                    value="42"
                    trend={{ val: "Stable", type: "neutral" }}
                    color="text-teal-400"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            {/* Main Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up stagger-2">
                {/* Daily Activity Chart */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white">Daily Activity</h3>
                            <p className="text-xs text-slate-400 font-medium">Reports vs Resolutions (this week)</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1.5 text-teal-500">
                                <span className="w-2 h-2 rounded-full bg-teal-500" />
                                Reports
                            </div>
                            <div className="flex items-center gap-1.5 text-teal-300">
                                <span className="w-2 h-2 rounded-full bg-teal-300" />
                                Solved
                            </div>
                        </div>
                    </div>
                    <MiniBarChart data={DAILY_ACTIVITY} />
                </div>

                {/* Category Growth */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-6">Incident Categories</h3>
                    <div className="space-y-4">
                        {CATEGORY_STATS.map((cat) => (
                            <div key={cat.name} className="group">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-300">{cat.name}</span>
                                    <span className={`text-[10px] font-bold ${cat.growth.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {cat.growth}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-125"
                                        style={{ width: `${(cat.count / 300) * 100}%`, backgroundColor: cat.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Smart Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up stagger-3">
                <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/5 backdrop-blur-xl border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24 text-teal-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Efficiency Insight</h3>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Response times in the <span className="text-teal-400 font-bold">Central Hub</span> have improved by <span className="text-emerald-400 font-bold">18%</span> this month due to new rapid-response protocols. Suggesting replication in <span className="text-rose-400 font-bold">East Coast</span>.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Citizen Engagement</h3>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        <span className="text-amber-400 font-bold">Waste Management</span> reports from Elite Contributors have peaked. Increasing point multipliers for <span className="text-cyan-400 font-bold">Safety</span> reports could balance the reporting distribution.
                    </p>
                </div>
            </div>

            {/* Regional Performance */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden animate-slide-up stagger-3 hover:border-teal-500/30 transition-all duration-300">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white">Regional Performance Matrix</h3>
                    <p className="text-xs text-slate-400 font-medium">Efficiency comparison across different municipal sectors.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5">Region / District</th>
                                <th className="px-8 py-5">Total Reports</th>
                                <th className="px-8 py-5">Avg. Resolution</th>
                                <th className="px-8 py-5">Satisfaction</th>
                                <th className="px-8 py-5 text-right">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {REGIONAL_PERFORMANCE.map((reg) => (
                                <tr key={reg.region} className="hover:bg-white/[0.03] transition-all group">
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">{reg.region}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-mono font-bold text-slate-300">{reg.reports}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-mono font-bold text-teal-400/80">{reg.avgResolution}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 min-w-[60px] h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${reg.satisfaction > 90 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                                                    style={{ width: `${reg.satisfaction}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-white">{reg.satisfaction}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1.5 text-emerald-400 font-bold text-xs">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                            </svg>
                                            Stable
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

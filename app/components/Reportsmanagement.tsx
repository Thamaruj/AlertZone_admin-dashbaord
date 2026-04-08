"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Report = {
    id: string;
    category: "Hazard" | "Lighting" | "Waste" | "Roads" | "Water" | "Safety";
    location: string;
    time: string;
    status: "Reported" | "In Progress" | "Solved" | "Closed";
    priority: "Low" | "Medium" | "High" | "Critical";
    description: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const REPORTS: Report[] = [
    { id: "#REP-8284", category: "Hazard", location: "122 Baker St. NW", time: "Oct 24, 2025 • 09:20 AM", status: "In Progress", priority: "High", description: "Exposed electrical wires near the bus stop." },
    { id: "#REP-8283", category: "Lighting", location: "Grand Central Station", time: "Oct 24, 2025 • 08:45 AM", status: "Reported", priority: "Medium", description: "Street light flickering repeatedly." },
    { id: "#REP-8292", category: "Roads", location: "Highway 401, Exit 4", time: "Oct 23, 2025 • 11:30 PM", status: "Solved", priority: "Critical", description: "Large pothole causing traffic disruption." },
    { id: "#REP-8281", category: "Waste", location: "Silicon Valley Plaza", time: "Oct 23, 2025 • 04:15 PM", status: "Closed", priority: "Low", description: "Overflowing trash bins behind the mall." },
    { id: "#REP-8301", category: "Water", location: "Main St. Fountain", time: "Oct 25, 2025 • 10:00 AM", status: "Reported", priority: "High", description: "Water pipe leaking onto the sidewalk." },
    { id: "#REP-8305", category: "Safety", location: "Central Park Entrance", time: "Oct 25, 2025 • 11:05 AM", status: "In Progress", priority: "Medium", description: "Broken safety railing on the pedestrian bridge." },
];

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

const priorityMeta: Record<Report["priority"], { color: string; bg: string }> = {
    Low: { color: "text-blue-300", bg: "bg-blue-500/10" },
    Medium: { color: "text-yellow-300", bg: "bg-yellow-500/10" },
    High: { color: "text-orange-400", bg: "bg-orange-400/10" },
    Critical: { color: "text-rose-500", bg: "bg-rose-500/10" },
};

export default function ReportsManagement() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<Report["status"] | "All">("All");

    // ─── Simulated Data Fetch ──────────────────────────────────────────────────
    // In the future, replace this with a Firebase onSnapshot or getDocs call
    useEffect(() => {
        const timer = setTimeout(() => {
            setReports(REPORTS);
            setLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const filteredReports = selectedTab === "All" 
        ? reports 
        : reports.filter(r => r.status === selectedTab);


    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-teal-300 tracking-tight pb-1">Reports Management</h1>
                    <p className="text-xs text-slate-300 mt-0.5">Filter, monitor, and manage citizen emergency reports.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Export Data
                    </button>
                    <button className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-teal-900/40 hover:from-teal-400 hover:to-cyan-400 transition-all transition-all active:scale-[0.98] flex items-center gap-2">
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        New Report
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#0f2233]/60 backdrop-blur-md border border-white/5 rounded-xl w-fit animate-slide-up stagger-1">
                {["All", "Reported", "In Progress", "Solved", "Closed"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab as any)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            selectedTab === tab 
                            ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" 
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        }`}
                    >
                        {tab}
                        {tab === "All" ? "" : ` (${REPORTS.filter(r => r.status === tab).length})`}
                    </button>
                ))}
            </div>

            {/* Reports List */}
            <div className="grid grid-cols-1 gap-4 animate-slide-up stagger-2">
                {loading ? (
                    // Loading Skeletons
                    [1, 2, 3].map((i) => (
                        <div key={i} className="bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 h-40 animate-pulse relative overflow-hidden">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-xl" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-white/5 rounded w-1/4" />
                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                    <div className="h-3 bg-white/5 rounded w-1/3" />
                                </div>
                            </div>
                            <div className="absolute top-5 right-5 w-24 h-6 bg-white/5 rounded-full" />
                            <div className="mt-8 pt-4 border-t border-white/5">
                                <div className="h-3 bg-white/5 rounded w-full" />
                            </div>
                        </div>
                    ))
                ) : filteredReports.map((report, idx) => {
                    const cat = categoryMeta[report.category];
                    const st = statusMeta[report.status];
                    const prio = priorityMeta[report.priority];

                    return (
                        <div 
                            key={report.id} 
                            className="group bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-2xl p-5 hover:border-teal-500/30 hover:shadow-[0_0_30px_rgb(20,184,166,0.05)] transition-all duration-300"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center text-xl shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                                        {cat.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white tracking-tight">{report.id}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${prio.bg} ${prio.color} border border-white/5`}>
                                                {report.priority}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-semibold text-slate-200">{report.category} Incident</h3>
                                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3 h-3 text-teal-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {report.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3 h-3 text-teal-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {report.time}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.color} border border-white/5`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                        {report.status}
                                    </span>
                                    <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-teal-400 hover:bg-white/10 transition-all group/btn">
                                        <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl italic">
                                    "{report.description}"
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {!loading && filteredReports.length === 0 && (

                <div className="flex flex-col items-center justify-center py-20 text-center animate-slide-up">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-4 opacity-50">
                        📁
                    </div>
                    <h3 className="text-slate-200 font-semibold">No reports found</h3>
                    <p className="text-slate-500 text-xs mt-1">There are no reports matching the selected filter.</p>
                </div>
            )}
        </div>
    );
}

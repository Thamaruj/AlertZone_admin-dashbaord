"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Report = {
    id: string;
    category: "Hazard" | "Lighting" | "Waste" | "Roads" | "Water" | "Safety";
    location: string;
    coordinates: { lat: number; lng: number };
    time: string;
    status: "Reported" | "In Progress" | "Solved" | "Closed";
    priority: "Low" | "Medium" | "High" | "Critical";
    description: string;
};

// ─── Mock Data (Consistent with Management View) ──────────────────────────────

const REPORTS: Report[] = [
    {
        id: "#REP-8284",
        category: "Hazard",
        location: "122 Baker St. NW",
        coordinates: { lat: 40.7128, lng: -74.0060 },
        time: "3 mins ago",
        status: "In Progress",
        priority: "High",
        description: "Exposed electrical wires near the bus stop."
    },
    {
        id: "#REP-8283",
        category: "Lighting",
        location: "Grand Central Station",
        coordinates: { lat: 40.7527, lng: -73.9772 },
        time: "14 mins ago",
        status: "Reported",
        priority: "Medium",
        description: "Street light flickering repeatedly."
    },
    {
        id: "#REP-8292",
        category: "Roads",
        location: "Highway 401, Exit 4",
        coordinates: { lat: 40.8448, lng: -73.8648 },
        time: "45 mins ago",
        status: "Solved",
        priority: "Critical",
        description: "Large pothole causing traffic disruption."
    },
    {
        id: "#REP-8281",
        category: "Waste",
        location: "Silicon Valley Plaza",
        coordinates: { lat: 40.7829, lng: -73.9654 },
        time: "1 hour ago",
        status: "Closed",
        priority: "Low",
        description: "Illegal dumping behind the commercial complex."
    },
    {
        id: "#REP-8295",
        category: "Water",
        location: "Riverside Dr. & 79th St",
        coordinates: { lat: 40.7850, lng: -73.9841 },
        time: "2 hours ago",
        status: "In Progress",
        priority: "High",
        description: "Main water pipe burst, flooding street."
    },
    {
        id: "#REP-8301",
        category: "Safety",
        location: "Central Park West",
        coordinates: { lat: 40.7711, lng: -73.9741 },
        time: "5 hours ago",
        status: "Reported",
        priority: "Critical",
        description: "Suspicious package reported near the entrance."
    }
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

export default function MapView() {
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [filter, setFilter] = useState<Report["category"] | "All">("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [zoom, setZoom] = useState(13);

    const filteredReports = useMemo(() => {
        return REPORTS.filter(r => {
            const matchesFilter = filter === "All" || r.category === filter;
            const matchesSearch = r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.id.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [filter, searchQuery]);

    // Map logic mock: transform lat/lng to representative X/Y percentages for the simulation
    // Central point (NYCish): 40.75, -73.98
    const mapCenter = { lat: 40.75, lng: -73.98 };
    const coordinateToPos = (lat: number, lng: number) => {
        const x = 50 + (lng - mapCenter.lng) * 500 * (zoom / 13);
        const y = 50 - (lat - mapCenter.lat) * 800 * (zoom / 13);
        return { x: `${x}%`, y: `${y}%` };
    };

    return (
        <div className="h-[calc(100vh-140px)] w-full flex flex-col lg:flex-row gap-5 animate-slide-up">

            {/* ── Left Sidebar: Report List ── */}
            <div className="w-full lg:w-80 flex flex-col bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/5 space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Active Reports</h2>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Live Feed - {filteredReports.length} Shown</p>
                    </div>

                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find location or ID..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 transition-all font-medium"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {["All", ...Object.keys(categoryMeta)].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat as any)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${filter === cat
                                    ? "bg-teal-500/20 border-teal-500/40 text-teal-400"
                                    : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-300 hover:border-white/10"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 p-3 custom-scrollbar">
                    {filteredReports.map((report) => {
                        const cat = categoryMeta[report.category];
                        const st = statusMeta[report.status];
                        const isSelected = selectedReport?.id === report.id;

                        return (
                            <button
                                key={report.id}
                                onClick={() => setSelectedReport(report)}
                                className={`w-full text-left p-3 rounded-xl border transition-all group ${isSelected
                                    ? "bg-teal-500/10 border-teal-500/30 ring-1 ring-teal-500/20 shadow-lg shadow-teal-900/10"
                                    : "bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/5"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                                        <span className="text-[10px] font-bold text-white tracking-tight">{report.id}</span>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${priorityMeta[report.priority].bg} ${priorityMeta[report.priority].color}`}>
                                        {report.priority}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center text-sm shadow-inner group-hover:scale-110 transition-transform`}>
                                        {cat.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-200 truncate">{report.location}</p>
                                        <p className="text-[10px] text-slate-400">{report.time}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {filteredReports.length === 0 && (
                        <div className="py-10 text-center opacity-40">
                            <p className="text-xs text-slate-300">No reports found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Main Map Area ── */}
            <div className="flex-1 bg-[#0d1f2d] rounded-2xl overflow-hidden border border-white/10 relative group/map cursor-crosshair">
                {/* Simulated Map Background */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#2dd4bf 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '100px 100px' }} />

                    {/* Abstract Map Lines (Simulating Roads) */}
                    <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 1000 1000">
                        <path d="M0,200 Q200,150 500,200 T1000,100" fill="none" stroke="#2dd4bf" strokeWidth="2" />
                        <path d="M100,0 L150,1000" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
                        <path d="M400,0 L420,1000" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
                        <path d="M850,0 Q700,500 900,1000" fill="none" stroke="#2dd4bf" strokeWidth="2" />
                        <path d="M0,600 L1000,650" fill="none" stroke="#2dd4bf" strokeWidth="2.5" />
                        <path d="M0,450 L1000,420" fill="none" stroke="#2dd4bf" strokeWidth="1" />
                    </svg>

                    {/* Markers */}
                    {filteredReports.map((report) => {
                        const pos = coordinateToPos(report.coordinates.lat, report.coordinates.lng);
                        const isSelected = selectedReport?.id === report.id;
                        const cat = categoryMeta[report.category];
                        const st = statusMeta[report.status];

                        return (
                            <div
                                key={report.id}
                                className="absolute transition-all duration-700 ease-out"
                                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)' }}
                            >
                                <button
                                    onClick={() => setSelectedReport(report)}
                                    className={`relative flex flex-col items-center group/pin ${isSelected ? 'z-50' : 'z-10'}`}
                                >
                                    {/* Tooltip on marker */}
                                    <div className={`absolute bottom-full mb-3 px-3 py-2 bg-[#0f2233] border border-white/10 rounded-xl shadow-2xl transition-all duration-300 min-w-[160px] pointer-events-none ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover/pin:opacity-100 group-hover/pin:scale-100'
                                        }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                            <span className="text-[10px] font-bold text-white">{report.id}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-200 truncate">{report.location}</p>
                                        <p className="text-[9px] text-teal-400/80 mt-1 uppercase font-bold tracking-tighter">{report.status}</p>
                                    </div>

                                    {/* Pin Visual */}
                                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${isSelected
                                        ? "scale-110 ring-4 ring-teal-500/20 bg-teal-500 text-white"
                                        : `${cat.bg} border border-white/20 text-white hover:scale-110`
                                        }`}>
                                        <span className="text-lg">{cat.icon}</span>

                                        {/* Status Ripple for active reports */}
                                        {(report.status === "Reported" || report.status === "In Progress") && (
                                            <span className={`absolute -inset-1 rounded-full animate-ping opacity-40 ${st.bg}`} />
                                        )}
                                    </div>

                                    {/* Pin Bottom shadow/indicator */}
                                    <div className={`w-2 h-2 rounded-full mt-1 blur-[1px] ${isSelected ? 'bg-teal-400' : 'bg-white/20'}`} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Map HUD Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className="bg-[#0f2233]/90 backdrop-blur-md rounded-xl border border-white/10 p-1 flex flex-col shadow-2xl">
                        <button onClick={() => setZoom(z => Math.min(z + 1, 18))} className="p-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m6-6H6" /></svg>
                        </button>
                        <div className="h-px bg-white/5 mx-2" />
                        <button onClick={() => setZoom(z => Math.max(z - 1, 10))} className="p-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 12H6" /></svg>
                        </button>
                    </div>

                    <button className="bg-[#0f2233]/90 backdrop-blur-md rounded-xl border border-white/10 p-3 text-slate-300 hover:text-teal-400 hover:bg-white/5 transition-all shadow-2xl">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>

                {/* Legend Overlay */}
                <div className="absolute bottom-4 left-4 p-3 bg-[#0f2233]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl flex gap-6">
                    <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Incident Types</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {Object.entries(categoryMeta).map(([label, meta]) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    <span className="text-xs">{meta.icon}</span>
                                    <span className="text-[10px] text-slate-300">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selection Details Panel */}
                {selectedReport && (
                    <div className="absolute bottom-4 right-4 max-w-sm bg-[#0f2233] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-right-10 duration-500 z-[100]">
                        <div className="p-4 flex gap-4">
                            <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl shadow-inner ${categoryMeta[selectedReport.category].bg}`}>
                                {categoryMeta[selectedReport.category].icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-sm font-bold text-white tracking-tight">{selectedReport.id}</h3>
                                        <p className="text-[11px] text-slate-400 font-medium truncate">{selectedReport.location}</p>
                                    </div>
                                    <button onClick={() => setSelectedReport(null)} className="text-slate-500 hover:text-white transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <div className="mt-3 flex gap-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusMeta[selectedReport.status].bg} ${statusMeta[selectedReport.status].color}`}>
                                        {selectedReport.status}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${priorityMeta[selectedReport.priority].bg} ${priorityMeta[selectedReport.priority].color}`}>
                                        {selectedReport.priority}
                                    </span>
                                </div>

                                <p className="mt-3 text-[11px] text-slate-300 leading-relaxed italic line-clamp-2">"{selectedReport.description}"</p>

                                <div className="mt-4 flex gap-2">
                                    <button className="flex-1 py-1.5 bg-teal-500 hover:bg-teal-400 text-white text-[10px] font-bold rounded-lg transition-all shadow-lg shadow-teal-900/20 active:scale-[0.98]">
                                        View Full Details
                                    </button>
                                    <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg transition-all">
                                        Dispatch
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Map Info Bar */}
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/5 rounded-full text-[9px] font-mono text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none">
                    <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" /> SYSTEM ACTIVE</span>
                    <span className="w-px h-2 bg-white/20" />
                    <span>REF: 40.75N, 73.98W</span>
                    <span className="w-px h-2 bg-white/20" />
                    <span>ZOOM: {zoom}x</span>
                </div>
            </div>
        </div>
    );
}

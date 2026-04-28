"use client";

import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import { MOCK_REPORTS as reports_data, Report } from "@/app/data/mockData";
import "leaflet/dist/leaflet.css";

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

// Custom Marker Helper (since standard L.Icon doesn't play well with Next.js paths easily)
let L: any;
if (typeof window !== "undefined") {
    L = require("leaflet");
}

const createCustomIcon = (catIcon: string, isSelected: boolean) => {
    if (!L) return null;
    return new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div class="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-teal-500/30 bg-teal-500' : 'bg-[#0f2233] border border-white/20 shadow-xl'} shadow-lg group">
                <span class="text-lg">${catIcon}</span>
              </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
};

export default function MapView() {
    const [reports] = useState<Report[]>(reports_data);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [filter, setFilter] = useState<Report["category"] | "All">("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading] = useState(false);

    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const matchesFilter = filter === "All" || r.category === filter;
            const matchesSearch = r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.id?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [reports, filter, searchQuery]);

    const mapCenter: [number, number] = [40.7128, -74.0060]; // Default NYC Center

    return (
        <div className="h-auto md:flex-1 w-full flex flex-col md:flex-row gap-4 md:gap-0 animate-slide-up">

            <style jsx global>{`
                .leaflet-container {
                    background: #0d1f2d !important;
                    width: 100%;
                    height: 100%;
                }
                .leaflet-control-zoom {
                    border: none !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important;
                }
                .leaflet-control-zoom-in, .leaflet-control-zoom-out {
                    background: #0f2233f0 !important;
                    color: #94a3b8 !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    backdrop-filter: blur(8px);
                }
                .leaflet-popup-content-wrapper {
                    background: #0f2233 !important;
                    color: white !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 12px !important;
                    padding: 0 !important;
                }
                .leaflet-popup-tip {
                    background: #0f2233 !important;
                }
            `}</style>

            {/* ── Left Sidebar: Report List ── */}
            <div className="w-full md:hidden h-[300px] flex flex-col bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl z-[1000] flex-shrink-0">
                <div className="p-4 border-b border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Active Reports</h2>
                            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mt-1">Live from Firebase</p>
                        </div>
                        {loading && (
                            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        )}
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
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${priorityMeta[report.priority]?.bg || 'bg-white/5'} ${priorityMeta[report.priority]?.color || 'text-slate-400'}`}>
                                        {report.priority}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${cat?.bg || 'bg-white/5'} flex items-center justify-center text-sm shadow-inner group-hover:scale-110 transition-transform`}>
                                        {cat?.icon || '📍'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-200 truncate">{report.location}</p>
                                        <p className="text-[10px] text-slate-400">{report.time}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {!loading && filteredReports.length === 0 && (
                        <div className="py-20 text-center opacity-40">
                            <p className="text-2xl mb-2">📁</p>
                            <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">No matching reports</p>
                            <p className="text-[10px] text-slate-500 mt-1">Check back later for updates</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Main Map Area (Leaflet) ── */}
            <div className="flex-1 min-h-[400px] bg-[#0d1f2d] md:rounded-none rounded-2xl overflow-hidden md:border-none border border-white/10 relative z-10 shadow-inner">
                {typeof window !== "undefined" && (
                    <MapContainer
                        center={selectedReport ? [selectedReport.coordinates.lat, selectedReport.coordinates.lng] : mapCenter}
                        zoom={13}
                        zoomControl={false}
                    >
                        {/* Dark Theme Tile Layer (CartoDB Dark Matter) */}
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />

                        <ZoomControl position="topright" />

                        {filteredReports.map((report) => (
                            <Marker
                                key={report.id}
                                position={[report.coordinates.lat, report.coordinates.lng]}
                                icon={createCustomIcon(categoryMeta[report.category]?.icon || '📍', selectedReport?.id === report.id) as any}
                                eventHandlers={{
                                    click: () => setSelectedReport(report),
                                }}
                            >
                                <Popup>
                                    <div className="p-2 min-w-[150px]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-white">{report.id}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-300 mb-2">{report.location}</p>
                                        <button className="w-full py-1.5 bg-teal-500 rounded text-[10px] font-bold text-white uppercase tracking-widest">Details View</button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}

                {/* Info BarHUD */}
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-mono text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none z-[1000]">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> SIMULATED STREAM</span>
                    <span className="w-px h-2 bg-white/20" />
                    <span>DATA: LOCAL MOCK</span>
                    <span className="w-px h-2 bg-white/20" />
                    <span>TARGET: {filteredReports.length} NODES</span>
                </div>

                {/* Selection Details Panel overlay - Fixed positioning */}
                {selectedReport && (
                    <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:max-w-sm bg-[#0f2233]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-right-10 duration-500 z-[1000]">
                        <div className="p-5 flex gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl shadow-inner ${categoryMeta[selectedReport.category]?.bg || 'bg-white/5'}`}>
                                {categoryMeta[selectedReport.category]?.icon || '📍'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-base font-bold text-white tracking-tight">{selectedReport.id}</h3>
                                        <p className="text-xs text-slate-400 font-medium truncate">{selectedReport.location}</p>
                                    </div>
                                    <button onClick={() => setSelectedReport(null)} className="p-1 text-slate-500 hover:text-white transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusMeta[selectedReport.status]?.bg} ${statusMeta[selectedReport.status]?.color}`}>
                                        {selectedReport.status}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityMeta[selectedReport.priority]?.bg} ${priorityMeta[selectedReport.priority]?.color}`}>
                                        {selectedReport.priority}
                                    </span>
                                </div>

                                <p className="mt-4 text-xs text-slate-300 leading-relaxed italic line-clamp-2 pr-2 opacity-80 uppercase tracking-tight font-medium">"{selectedReport.description}"</p>

                                <div className="mt-6 flex gap-2">
                                    <button className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:brightness-110 text-white text-[10px] font-bold rounded-xl transition-all shadow-lg shadow-teal-900/40 active:scale-[0.98] uppercase tracking-widest">
                                        Open Management
                                    </button>
                                    <button className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest">
                                        Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

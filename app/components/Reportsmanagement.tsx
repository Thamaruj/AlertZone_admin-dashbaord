"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

type Reporter = {
    name: string;
    phone: string;
    email: string;
    reportsCount: number;
};

type Note = {
    id: string;
    author: string;
    text: string;
    time: string;
};

type Report = {
    id: string;
    category: "Hazard" | "Lighting" | "Waste" | "Roads" | "Water" | "Safety";
    location: string;
    coordinates: { lat: number; lng: number };
    time: string;
    status: "Reported" | "In Progress" | "Solved" | "Closed";
    priority: "Low" | "Medium" | "High" | "Critical";
    description: string;
    images: string[];
    reporter: Reporter;
    notes: Note[];
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const REPORTS: Report[] = [
    { 
        id: "#REP-8284", 
        category: "Hazard", 
        location: "122 Baker St. NW", 
        coordinates: { lat: 40.7128, lng: -74.0060 },
        time: "Oct 24, 2025 • 09:20 AM", 
        status: "In Progress", 
        priority: "High", 
        description: "Exposed electrical wires near the bus stop. The wires are sparking occasionally and are close to a puddle.",
        images: [
            "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1516937941344-00b4e0337589?q=80&w=600&auto=format&fit=crop"
        ],
        reporter: {
            name: "John Doe",
            phone: "+1 (555) 123-4567",
            email: "john.doe@example.com",
            reportsCount: 5
        },
        notes: [
            { id: "n1", author: "Alex (Admin)", text: "Dispatched electrical team at 10:00 AM.", time: "Oct 24, 2:15 PM" }
        ]
    },
    { 
        id: "#REP-8283", 
        category: "Lighting", 
        location: "Grand Central Station", 
        coordinates: { lat: 40.7527, lng: -73.9772 },
        time: "Oct 24, 2025 • 08:45 AM", 
        status: "Reported", 
        priority: "Medium", 
        description: "Street light flickering repeatedly. Causes poor visibility for drivers at night.",
        images: [
            "https://images.unsplash.com/photo-1471101173712-b9884175254e?q=80&w=600&auto=format&fit=crop"
        ],
        reporter: {
            name: "Sarah Miller",
            phone: "+1 (555) 987-6543",
            email: "s.miller@webmail.com",
            reportsCount: 2
        },
        notes: []
    },
    { 
        id: "#REP-8292", 
        category: "Roads", 
        location: "Highway 401, Exit 4", 
        coordinates: { lat: 40.8448, lng: -73.8648 },
        time: "Oct 23, 2025 • 11:30 PM", 
        status: "Solved", 
        priority: "Critical", 
        description: "Large pothole causing traffic disruption. Several cars have suffered tire damage.",
        images: [
            "https://images.unsplash.com/photo-1599389717196-80517726d36e?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1544027960-ca2ca8985172?q=80&w=600&auto=format&fit=crop"
        ],
        reporter: {
            name: "Michael Chen",
            phone: "+1 (555) 444-3333",
            email: "mchen@roads.org",
            reportsCount: 12
        },
        notes: [
            { id: "n2", author: "Team Lead", text: "Patching completed. Road reopened.", time: "Oct 24, 8:00 AM" }
        ]
    },
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
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [newNote, setNewNote] = useState("");

    // ─── Simulated Data Fetch ──────────────────────────────────────────────────
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

    // ─── Update Status Function ───────────────────────────────────────────────
    const updateReportStatus = (id: string, newStatus: Report["status"]) => {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        if (selectedReport?.id === id) {
            setSelectedReport(prev => prev ? { ...prev, status: newStatus } : null);
        }
    };

    // ─── Add Note Function ────────────────────────────────────────────────────
    const handleAddNote = () => {
        if (!newNote.trim() || !selectedReport) return;
        const note: Note = {
            id: Math.random().toString(36).substr(2, 9),
            author: "Alex Morgan (Admin)",
            text: newNote,
            time: "Just now"
        };
        const updatedReport = { ...selectedReport, notes: [note, ...selectedReport.notes] };
        setReports(prev => prev.map(r => r.id === selectedReport.id ? updatedReport : r));
        setSelectedReport(updatedReport);
        setNewNote("");
    };

    return (
        <div className="space-y-6 relative">
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
                        {tab === "All" ? "" : ` (${reports.filter(r => r.status === tab).length})`}
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
                ) : filteredReports.map((report) => {
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
                                    <button 
                                        onClick={() => setSelectedReport(report)}
                                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-teal-400 hover:bg-white/10 transition-all group/btn"
                                    >
                                        <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl italic line-clamp-2">
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

            {/* ─── Detail Modal ────────────────────────────────────────────────── */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        onClick={() => setSelectedReport(null)}
                    />
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0f2233] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col">
                        
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/2 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${categoryMeta[selectedReport.category].bg} flex items-center justify-center text-xl`}>
                                    {categoryMeta[selectedReport.category].icon}
                                </div>
                                <div>
                                    <h2 className="text-white font-bold tracking-tight">{selectedReport.id} Details</h2>
                                    <p className="text-[11px] text-slate-400">View evidence, location, and manage notes</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedReport(null)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            
                            {/* Top Grid: Overview + Map */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</p>
                                            <p className="text-sm font-semibold text-slate-200">{selectedReport.category}</p>
                                        </div>
                                        <div className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority</p>
                                            <div className={`w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityMeta[selectedReport.priority].bg} ${priorityMeta[selectedReport.priority].color} border border-white/5`}>
                                                {selectedReport.priority}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/3 border border-white/5 rounded-2xl space-y-3">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reporter Evidence</p>
                                        <p className="text-xs text-slate-300 leading-relaxed italic">"{selectedReport.description}"</p>
                                        <div className="flex gap-2.5 mt-2 overflow-x-auto pb-1">
                                            {selectedReport.images.map((img, i) => (
                                                <div key={i} className="relative w-32 h-32 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 group/img">
                                                    <img src={img} alt="Evidence" className="w-full h-full object-crop object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Map Placeholder */}
                                <div className="relative h-full min-h-[240px] bg-slate-900 rounded-2xl overflow-hidden border border-white/10 group/map">
                                    <div className="absolute inset-0 bg-[#0d1f2d] flex items-center justify-center">
                                        {/* Mock Map Background */}
                                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#2dd4bf 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
                                        <div className="relative text-center">
                                            <div className="inline-flex p-3 bg-teal-500/10 rounded-full animate-bounce">
                                                <svg className="w-8 h-8 text-teal-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                            </div>
                                            <p className="text-[11px] text-teal-400/80 font-mono mt-2 uppercase tracking-widest">{selectedReport.coordinates.lat.toFixed(4)}, {selectedReport.coordinates.lng.toFixed(4)}</p>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4 p-2 bg-[#0f2233]/90 backdrop-blur-md rounded-lg border border-white/10 text-[10px] text-slate-200">
                                        {selectedReport.location}
                                    </div>
                                    <div className="absolute bottom-4 right-4 flex flex-col gap-1">
                                        <button className="p-2 bg-white/10 hover:bg-white/20 rounded shadow-lg text-white transition-colors backdrop-blur-md border border-white/10">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5"/></svg>
                                        </button>
                                        <button className="p-2 bg-white/10 hover:bg-white/20 rounded shadow-lg text-white transition-colors backdrop-blur-md border border-white/10">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12H4" strokeWidth="2.5"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Citizen Details & Management */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Reporter Card */}
                                <div className="p-5 bg-white/2 border border-white/5 rounded-2xl space-y-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reporter Details</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                            {selectedReport.reporter.name.split(' ').map(n=>n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-200">{selectedReport.reporter.name}</p>
                                            <p className="text-[10px] text-slate-400">{selectedReport.reporter.phone}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-500">Total Reports</span>
                                            <span className="text-teal-400 font-bold">{selectedReport.reporter.reportsCount}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-500">Trust Level</span>
                                            <span className="text-green-400">High</span>
                                        </div>
                                    </div>
                                    <button className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-white/10 transition-colors uppercase tracking-widest">
                                        View Full Profile
                                    </button>
                                </div>

                                {/* Status Update */}
                                <div className="lg:col-span-2 space-y-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Update Progress Status</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {(["Reported", "In Progress", "Solved", "Closed"] as Report["status"][]).map((st) => (
                                            <button
                                                key={st}
                                                onClick={() => updateReportStatus(selectedReport.id, st)}
                                                className={`px-3 py-3 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                                                    selectedReport.status === st
                                                    ? `${statusMeta[st].bg} ${statusMeta[st].color} border-teal-500/30 ring-1 ring-teal-500/20 shadow-lg shadow-teal-900/40`
                                                    : "bg-[#0d1f2d] text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-300"
                                                }`}
                                            >
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${statusMeta[st].dot}`} />
                                                    {st}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Internal Notes Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Internal Admin Notes</p>
                                    <span className="text-[10px] text-slate-400 font-mono">{selectedReport.notes.length} notes</span>
                                </div>
                                
                                {/* Add Note Input */}
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Add a private note for other admins..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 transition-colors"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                    />
                                    <button 
                                        onClick={handleAddNote}
                                        className="px-4 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl text-xs font-bold hover:bg-teal-500/20 transition-all"
                                    >
                                        Add Note
                                    </button>
                                </div>

                                {/* Notes List */}
                                <div className="space-y-3">
                                    {selectedReport.notes.map((note) => (
                                        <div key={note.id} className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-teal-400/80">{note.author}</span>
                                                <span className="text-[9px] text-slate-500 font-mono">{note.time}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-300 leading-relaxed">{note.text}</p>
                                        </div>
                                    ))}
                                    {selectedReport.notes.length === 0 && (
                                        <p className="text-center py-4 text-[10px] text-slate-500 italic">No notes added yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 bg-white/2 border-t border-white/5 flex justify-end gap-3 flex-shrink-0">
                            <button 
                                onClick={() => setSelectedReport(null)}
                                className="px-8 py-3 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 text-teal-400 border border-teal-500/30 text-xs font-bold rounded-xl shadow-lg transition-all"
                            >
                                Close Management View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

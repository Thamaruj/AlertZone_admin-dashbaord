"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { collection, doc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    type: "internal" | "public"; // internal = admin only, public = visible to reporter
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
            { id: "n1", author: "Alex Morgan (Admin)", text: "Dispatched electrical team at 10:00 AM.", time: "Oct 24, 2:15 PM", type: "internal" }
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
            { id: "n2", author: "Team Lead", text: "Patching completed. Road reopened.", time: "Oct 24, 8:00 AM", type: "public" }
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
    const [tempStatus, setTempStatus] = useState<Report["status"] | "">("");
    const [statusReason, setStatusReason] = useState("");
    const [newNote, setNewNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Note filtering state
    const [noteFilter, setNoteFilter] = useState<"all" | "internal" | "public">("all");

    // ─── Firebase Real-time Connection ──────────────────────────────────────────
    useEffect(() => {
        const q = query(collection(db, "reports"), orderBy("time", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reportsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Report[];

            setReports(reportsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reports:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredReports = selectedTab === "All"
        ? reports
        : reports.filter(r => r.status === selectedTab);

    // ─── Update Status Function ───────────────────────────────────────────────
    const handleSaveStatus = async () => {
        if (!selectedReport || !tempStatus || tempStatus === selectedReport.status) return;

        setIsSaving(true);
        const newStatus = tempStatus as Report["status"];

        // Add status reason as a public note if provided
        const notes = [...(selectedReport.notes || [])];
        if (statusReason.trim()) {
            notes.unshift({
                id: Math.random().toString(36).substr(2, 9),
                author: "Admin Team",
                text: `Status Update: ${newStatus}. Note: ${statusReason}`,
                time: String(new Date().toLocaleDateString()),
                type: "public"
            });
        }

        try {
            const reportRef = doc(db, "reports", selectedReport.id);
            await updateDoc(reportRef, {
                status: newStatus,
                notes: notes
            });
            setStatusReason("");
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status in Firebase.");
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Note Management Functions ───────────────────────────────────────────
    const handleAddNote = async () => {
        if (!newNote.trim() || !selectedReport) return;
        const note: Note = {
            id: Math.random().toString(36).substr(2, 9),
            author: "Alex Morgan (Admin)",
            text: newNote,
            time: String(new Date().toLocaleDateString()),
            type: "internal"
        };

        try {
            const reportRef = doc(db, "reports", selectedReport.id);
            const updatedNotes = [note, ...(selectedReport.notes || [])];
            await updateDoc(reportRef, {
                notes: updatedNotes
            });
            setNewNote("");
        } catch (error) {
            console.error("Error adding note:", error);
            alert("Failed to add note to Firebase.");
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!selectedReport) return;
        const updatedNotes = selectedReport.notes.filter(n => n.id !== noteId);

        try {
            const reportRef = doc(db, "reports", selectedReport.id);
            await updateDoc(reportRef, {
                notes: updatedNotes
            });
        } catch (error) {
            console.error("Error deleting note:", error);
            alert("Failed to delete note from Firebase.");
        }
    };

    const openDetails = (report: Report) => {
        setSelectedReport(report);
        setTempStatus(report.status);
        setStatusReason("");
        setNoteFilter("all"); // Reset filter when opening new report
    };

    // Filtered notes based on tab selection
    const visibleNotes = selectedReport?.notes.filter(note => {
        if (noteFilter === "all") return true;
        return note.type === noteFilter;
    }) || [];

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

            {/* Filter Tabs - Scrollable on mobile */}
            <div className="flex items-center gap-1 p-1 bg-[#0f2233]/60 backdrop-blur-md border border-white/5 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar animate-slide-up stagger-1">
                {["All", "Reported", "In Progress", "Solved", "Closed"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab as any)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${selectedTab === tab
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
                                        onClick={() => openDetails(report)}
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
                    <div className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-[#0f2233] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col mx-2 sm:mx-0">

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
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">

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
                                                <svg className="w-8 h-8 text-teal-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                            </div>
                                            <p className="text-[11px] text-teal-400/80 font-mono mt-2 uppercase tracking-widest">{selectedReport.coordinates.lat.toFixed(4)}, {selectedReport.coordinates.lng.toFixed(4)}</p>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4 p-2 bg-[#0f2233]/90 backdrop-blur-md rounded-lg border border-white/10 text-[10px] text-slate-200">
                                        {selectedReport.location}
                                    </div>
                                    <div className="absolute bottom-4 right-4 flex flex-col gap-1">
                                        <button className="p-2 bg-white/10 hover:bg-white/20 rounded shadow-lg text-white transition-colors backdrop-blur-md border border-white/10">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" /></svg>
                                        </button>
                                        <button className="p-2 bg-white/10 hover:bg-white/20 rounded shadow-lg text-white transition-colors backdrop-blur-md border border-white/10">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12H4" strokeWidth="2.5" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Citizen Details & Management */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                {/* Reporter Card */}
                                <div className="p-5 bg-white/2 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Reporter Details</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                                {selectedReport.reporter.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-200">{selectedReport.reporter.name}</p>
                                                <p className="text-[10px] text-slate-400">{selectedReport.reporter.phone}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 pt-4">
                                            <div className="flex justify-between text-[11px]">
                                                <span className="text-slate-500">Total Reports</span>
                                                <span className="text-teal-400 font-bold">{selectedReport.reporter.reportsCount}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px]">
                                                <span className="text-slate-500">Trust Level</span>
                                                <span className="text-green-400 font-bold">Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full mt-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-white/10 transition-colors uppercase tracking-widest">
                                        View Full Profile
                                    </button>
                                </div>

                                {/* Status Update Dropdown Section */}
                                <div className="lg:col-span-2 p-5 bg-white/2 border border-white/5 rounded-2xl flex flex-col gap-4 shadow-inner">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Update Progress Status</p>
                                        <p className="text-xs text-slate-400 italic">Select the stage and provide a reason for the reporter.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                                            <div className="w-full relative group">
                                                <select
                                                    value={tempStatus}
                                                    onChange={(e) => setTempStatus(e.target.value as any)}
                                                    className="w-full appearance-none bg-[#0d1f2d] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 transition-all cursor-pointer hover:bg-[#0f2233]"
                                                >
                                                    <option value="Reported">Reported</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Solved">Solved</option>
                                                    <option value="Closed">Closed</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-teal-400 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2.5" /></svg>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleSaveStatus}
                                                disabled={isSaving || tempStatus === selectedReport.status}
                                                className={`min-w-[140px] px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${tempStatus === selectedReport.status
                                                    ? "bg-slate-700/20 text-slate-500 border border-white/5 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-teal-900/40 hover:brightness-110 active:scale-[0.98]"
                                                    }`}
                                            >
                                                {isSaving ? (
                                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" /></svg>
                                                )}
                                                {isSaving ? "Saving..." : "Save Status"}
                                            </button>
                                        </div>

                                        {/* Status Update Reason */}
                                        <div className="relative">
                                            <textarea
                                                value={statusReason}
                                                onChange={(e) => setStatusReason(e.target.value)}
                                                placeholder="Provide a reason or update details for the citizen (e.g., 'Team dispatched', 'Maintenance scheduled') - Optional"
                                                className="w-full bg-[#0d1f2d] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 transition-colors resize-none h-16 placeholder:text-slate-600"
                                            />
                                        </div>
                                    </div>

                                    {tempStatus !== selectedReport.status && !isSaving && (
                                        <p className="text-[10px] text-teal-400 font-medium animate-pulse">
                                            ⚠️ You have unsaved changes to the status.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Notes Section Component */}
                            <div className="space-y-6">
                                {/* Navigation for Notes Filter */}
                                <div className="flex items-center gap-6 border-b border-white/5 pb-2">
                                    <button
                                        onClick={() => setNoteFilter("all")}
                                        className={`text-[10px] font-bold uppercase tracking-widest pb-2 transition-all border-b-2 ${noteFilter === "all" ? "text-teal-400 border-teal-500" : "text-slate-500 border-transparent hover:text-slate-300"
                                            }`}
                                    >
                                        Timeline & Notes
                                    </button>
                                    <button
                                        onClick={() => setNoteFilter("internal")}
                                        className={`text-[10px] font-bold uppercase tracking-widest pb-2 transition-all border-b-2 ${noteFilter === "internal" ? "text-teal-400 border-teal-500" : "text-slate-500 border-transparent hover:text-slate-300"
                                            }`}
                                    >
                                        Internal Only
                                    </button>
                                    <button
                                        onClick={() => setNoteFilter("public")}
                                        className={`text-[10px] font-bold uppercase tracking-widest pb-2 transition-all border-b-2 ${noteFilter === "public" ? "text-teal-400 border-teal-500" : "text-slate-500 border-transparent hover:text-slate-300"
                                            }`}
                                    >
                                        Public Updates
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Add Note Section */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Add Internal Note</p>
                                        <div className="p-4 bg-white/2 border border-white/5 rounded-2xl flex flex-col gap-3">
                                            <textarea
                                                value={newNote}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                placeholder="Add a private note for other admins..."
                                                className="w-full bg-[#0d1f2d] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 transition-colors resize-none h-24 placeholder:text-slate-500"
                                            />
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] text-slate-600 font-mono">{newNote.length} chars</span>
                                                <button
                                                    onClick={handleAddNote}
                                                    disabled={!newNote.trim()}
                                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${!newNote.trim()
                                                        ? "bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed"
                                                        : "bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20"
                                                        }`}
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" /></svg>
                                                    Add Note
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes List Timeline */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                {noteFilter === "internal" ? "Internal Logs" : noteFilter === "public" ? "Public Feed" : "Full History"}
                                            </p>
                                            <span className="text-[10px] text-slate-400 font-mono">{visibleNotes.length} items</span>
                                        </div>

                                        <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                                            {visibleNotes.map((note) => (
                                                <div key={note.id} className={`group/note p-4 border rounded-2xl space-y-2 relative transition-all ${note.type === 'public'
                                                    ? 'bg-teal-500/5 border-teal-500/20'
                                                    : 'bg-white/3 border-white/5 hover:bg-white/[0.05]'
                                                    }`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${note.type === 'public' ? 'bg-teal-400 animate-pulse' : 'bg-slate-500'}`} />
                                                            <span className={`text-[10px] font-bold ${note.type === 'public' ? 'text-teal-400' : 'text-slate-400'}`}>
                                                                {note.author} {note.type === 'public' && "• Public Update"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] text-slate-500 font-mono">{note.time}</span>
                                                            <button
                                                                onClick={() => handleDeleteNote(note.id)}
                                                                className="p-1 opacity-0 group-hover/note:opacity-100 text-slate-600 hover:text-rose-400 transition-all"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-slate-300 leading-relaxed pr-6">{note.text}</p>
                                                </div>
                                            ))}
                                            {visibleNotes.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                                    <svg className="w-8 h-8 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeWidth="1.5" /></svg>
                                                    <p className="text-[10px] text-slate-500">No {noteFilter === "all" ? "history" : noteFilter} items found.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 bg-white/2 border-t border-white/5 flex justify-end gap-3 flex-shrink-0">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold rounded-xl transition-all"
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

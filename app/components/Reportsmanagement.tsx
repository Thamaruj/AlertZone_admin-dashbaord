"use client";

import { useState } from "react";
import { useReports } from "@/lib/hooks/useReports";
import { Report, ReportStatus } from "@/lib/types/report";
import { categoryStyleMeta } from "@/lib/constants/categories";
import { statusStyleMeta } from "@/lib/constants/statuses";

export default function ReportsManagement() {
    const { reports, loading, changeStatus } = useReports("All");
    const [selectedTab, setSelectedTab] = useState<ReportStatus | "All">("All");
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [tempStatus, setTempStatus] = useState<ReportStatus | "">("");
    const [statusReason, setStatusReason] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const filteredReports = selectedTab === "All"
        ? reports
        : reports.filter(r => r.status === selectedTab);

    // ─── Update Status Function ───────────────────────────────────────────────
    const handleSaveStatus = async () => {
        if (!selectedReport || !tempStatus || tempStatus === selectedReport.status) return;

        setIsSaving(true);
        const newStatus = tempStatus as ReportStatus;

        try {
            await changeStatus(selectedReport.id, newStatus, statusReason.trim() ? statusReason : undefined);
            
            // Status changes in Firestore will trigger onSnapshot and update the list,
            // but we also update the local selected report for immediate feedback
            setSelectedReport(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    status: newStatus,
                    statusHistory: [
                        ...(prev.statusHistory || []),
                        { status: newStatus, changedAt: new Date().toISOString(), changedBy: "Admin", note: statusReason }
                    ]
                };
            });
            setStatusReason("");
            setShowConfirm(false);
        } catch (error) {
            console.error("Failed to save status", error);
            alert("Failed to update report status.");
        } finally {
            setIsSaving(false);
        }
    };

    const openDetails = (report: Report) => {
        setSelectedReport(report);
        setTempStatus(report.status);
        setStatusReason("");
        setShowConfirm(false);
    };

    const formatDate = (dateValue: any) => {
        if (!dateValue) return "Unknown date";
        if (typeof dateValue?.toDate === 'function') {
            return dateValue.toDate().toLocaleString();
        }
        return new Date(dateValue).toLocaleString();
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
                    <button className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-teal-900/40 hover:from-teal-400 hover:to-cyan-400 transition-all active:scale-[0.98] flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        New Report
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#0f2233]/60 backdrop-blur-md border border-white/5 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar animate-slide-up stagger-1">
                {(["All", "PENDING", "ASSIGNED", "FIXING", "RESOLVED", "REJECTED"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${selectedTab === tab
                            ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                            }`}
                    >
                        {tab === "All" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                        {tab === "All" ? "" : ` (${reports.filter(r => r.status === tab).length})`}
                    </button>
                ))}
            </div>

            {/* Reports List */}
            <div className="grid grid-cols-1 gap-4 animate-slide-up stagger-2">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-4 opacity-50">
                            📁
                        </div>
                        <h3 className="text-slate-200 font-semibold">No reports found</h3>
                        <p className="text-slate-500 text-xs mt-1">There are no reports matching the selected filter.</p>
                    </div>
                ) : (
                    filteredReports.map((report) => {
                        const cat = categoryStyleMeta[report.category] || categoryStyleMeta["Other"];
                        const st = statusStyleMeta[report.status] || { color: "text-slate-400", bg: "bg-slate-500/10", dot: "bg-slate-400" };

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
                                            </div>
                                            <h3 className="text-sm font-semibold text-slate-200">{report.category} Incident</h3>
                                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3 text-teal-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    {report.location?.area || "Unknown Area"}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3 text-teal-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {formatDate(report.createdAt)}
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
                    })
                )}
            </div>

            {/* ─── Detail Modal ────────────────────────────────────────────────── */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedReport(null)}
                    />
                    <div className="relative w-full max-w-4xl max-h-[95vh] bg-[#0f2233] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col mx-2 sm:mx-0">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/2 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${(categoryStyleMeta[selectedReport.category] || categoryStyleMeta["Other"]).bg} flex items-center justify-center text-xl`}>
                                    {(categoryStyleMeta[selectedReport.category] || categoryStyleMeta["Other"]).icon}
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
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Submitted</p>
                                            <p className="text-sm font-semibold text-slate-200">{formatDate(selectedReport.createdAt)}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/3 border border-white/5 rounded-2xl space-y-3">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reporter Evidence</p>
                                        <p className="text-xs text-slate-300 leading-relaxed italic">"{selectedReport.description}"</p>
                                        <div className="flex gap-2.5 mt-2 overflow-x-auto pb-1">
                                            {selectedReport.imageUrls?.map((img, i) => (
                                                <div key={i} className="relative w-32 h-32 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 group/img">
                                                    <img src={img} alt="Evidence" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                                </div>
                                            ))}
                                            {(!selectedReport.imageUrls || selectedReport.imageUrls.length === 0) && (
                                                <div className="text-xs text-slate-500 italic py-2">No images provided.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Map Placeholder */}
                                <div className="relative h-full min-h-[240px] bg-slate-900 rounded-2xl overflow-hidden border border-white/10 group/map">
                                    <div className="absolute inset-0 bg-[#0d1f2d] flex items-center justify-center">
                                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#2dd4bf 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
                                        <div className="relative text-center">
                                            <div className="inline-flex p-3 bg-teal-500/10 rounded-full animate-bounce">
                                                <svg className="w-8 h-8 text-teal-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                            </div>
                                            {selectedReport.location && (
                                                <p className="text-[11px] text-teal-400/80 font-mono mt-2 uppercase tracking-widest">
                                                    {selectedReport.location.latitude?.toFixed(4) || "0.0000"}, {selectedReport.location.longitude?.toFixed(4) || "0.0000"}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4 p-2 bg-[#0f2233]/90 backdrop-blur-md rounded-lg border border-white/10 text-[10px] text-slate-200">
                                        {selectedReport.location?.area || "Unknown Area"}
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
                                                {selectedReport.authorName ? selectedReport.authorName.split(' ').map(n => n[0]).join('').substring(0, 2) : '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-200">{selectedReport.authorName || "Anonymous"}</p>
                                                <p className="text-[10px] text-slate-400">Upvotes: {selectedReport.upvoteCount || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Update Dropdown Section */}
                                <div className="lg:col-span-2 p-5 bg-white/2 border border-white/5 rounded-2xl flex flex-col gap-4 shadow-inner">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Update Progress Status</p>
                                        <p className="text-xs text-slate-400 italic">Select the stage and provide a reason for the reporter.</p>
                                    </div>

                                    {!showConfirm ? (
                                        <div className="space-y-3">
                                            <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                                                <div className="w-full relative group">
                                                    <select
                                                        value={tempStatus}
                                                        onChange={(e) => setTempStatus(e.target.value as ReportStatus)}
                                                        className="w-full appearance-none bg-[#0d1f2d] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 transition-all cursor-pointer hover:bg-[#0f2233]"
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="ASSIGNED">Assigned</option>
                                                        <option value="FIXING">Fixing</option>
                                                        <option value="RESOLVED">Resolved</option>
                                                        <option value="REJECTED">Rejected</option>
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-teal-400 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2.5" /></svg>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setShowConfirm(true)}
                                                    disabled={isSaving || tempStatus === selectedReport.status}
                                                    className={`min-w-[140px] px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${tempStatus === selectedReport.status
                                                        ? "bg-slate-700/20 text-slate-500 border border-white/5 cursor-not-allowed"
                                                        : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-teal-900/40 hover:brightness-110 active:scale-[0.98]"
                                                        }`}
                                                >
                                                    Review Change
                                                </button>
                                            </div>

                                            <div className="relative">
                                                <textarea
                                                    value={statusReason}
                                                    onChange={(e) => setStatusReason(e.target.value)}
                                                    placeholder="Provide a reason or update details for the citizen..."
                                                    className="w-full bg-[#0d1f2d] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 transition-colors resize-none h-16 placeholder:text-slate-600"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 border border-teal-500/30 bg-teal-500/10 rounded-xl animate-in fade-in zoom-in-95">
                                            <p className="text-sm font-semibold text-slate-200 mb-2">Confirm Status Change</p>
                                            <p className="text-xs text-slate-300 mb-4">
                                                You are about to change the status from <span className="font-bold text-orange-400">{selectedReport.status}</span> to <span className="font-bold text-teal-400">{tempStatus}</span>. This will send a notification to the citizen.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleSaveStatus}
                                                    disabled={isSaving}
                                                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    {isSaving ? "Saving..." : "Confirm & Send"}
                                                </button>
                                                <button
                                                    onClick={() => setShowConfirm(false)}
                                                    disabled={isSaving}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-white/10"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status History Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Timeline & Notes</p>
                                    <span className="text-[10px] text-slate-400 font-mono">{(selectedReport.statusHistory || []).length} items</span>
                                </div>

                                <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                                    {(!selectedReport.statusHistory || selectedReport.statusHistory.length === 0) && (
                                        <p className="text-xs text-slate-500 italic">No history available for this report.</p>
                                    )}
                                    {/* Reversing history to show latest first */}
                                    {selectedReport.statusHistory?.slice().reverse().map((entry, idx) => (
                                        <div key={idx} className="p-4 border rounded-2xl space-y-2 relative transition-all bg-white/3 border-white/5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-teal-400">Status changed to {entry.status}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] text-slate-500 font-mono">{formatDate(entry.changedAt)}</span>
                                                </div>
                                            </div>
                                            {entry.note && (
                                                <p className="text-[11px] text-slate-300 leading-relaxed italic">Note: "{entry.note}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 bg-white/2 border-t border-white/5 flex justify-end flex-shrink-0">
                            <button onClick={() => setSelectedReport(null)} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold rounded-xl transition-all">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

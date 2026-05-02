"use client";

import { useState } from "react";
import { MOCK_NOTIFICATIONS, Notification, NotificationType } from "@/app/data/mockData";

// ─── Constants & Meta ─────────────────────────────────────────────────────────

const typeMeta: Record<NotificationType, { color: string; bg: string; icon: React.ReactNode }> = {
    System: {
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth="2" /></svg>
    },
    Report: {
        color: "text-teal-400",
        bg: "bg-teal-500/10",
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    User: {
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    },
    Alert: {
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    }
};

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [selectedTab, setSelectedTab] = useState<"All" | "Unread" | NotificationType>("All");

    const filteredNotifications = notifications.filter(n => {
        if (selectedTab === "All") return true;
        if (selectedTab === "Unread") return !n.isRead;
        return n.type === selectedTab;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleDelete = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="space-y-6 relative h-full flex flex-col">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-teal-300 tracking-tight pb-1 flex items-center gap-3">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.5)]">
                                {unreadCount} New
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-slate-300 mt-0.5">Stay updated with system alerts and incoming reports.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${unreadCount === 0
                            ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                            : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        Mark All as Read
                    </button>
                    <button className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg shadow-lg shadow-teal-900/40 hover:from-teal-400 hover:to-cyan-400 transition-all active:scale-[0.98]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth="2" /></svg>
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#0f2233]/60 backdrop-blur-md border border-white/5 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar animate-slide-up stagger-1 flex-shrink-0">
                {["All", "Unread", "Alert", "Report", "System", "User"].map((tab) => {
                    const isSelected = selectedTab === tab;
                    let count = 0;
                    if (tab === "All") count = notifications.length;
                    else if (tab === "Unread") count = unreadCount;
                    else count = notifications.filter(n => n.type === tab).length;

                    return (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab as any)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${isSelected
                                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                }`}
                        >
                            {tab}
                            {count > 0 && tab !== "All" ? ` (${count})` : ""}
                        </button>
                    );
                })}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto animate-slide-up stagger-2 pr-2 custom-scrollbar">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-4 opacity-50 relative">
                            📭
                            {selectedTab === "Unread" && unreadCount === 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(20,184,166,0.5)]">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </div>
                        <h3 className="text-slate-200 font-semibold">{selectedTab === "Unread" ? "You're all caught up!" : "No notifications found"}</h3>
                        <p className="text-slate-500 text-xs mt-1">{selectedTab === "Unread" ? "You have read all your notifications." : "There are no notifications matching the selected filter."}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notif) => {
                            const meta = typeMeta[notif.type];
                            return (
                                <div
                                    key={notif.id}
                                    className={`group relative bg-[#0f2233]/80 backdrop-blur-xl border rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${notif.isRead
                                        ? "border-white/5 opacity-80 hover:opacity-100 hover:border-white/10"
                                        : "border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.05)] hover:border-teal-500/50"
                                        }`}
                                >
                                    {/* Unread Indicator */}
                                    {!notif.isRead && (
                                        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-1/2 bg-teal-400 rounded-r-full shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                                    )}

                                    <div className="flex items-start gap-4 pl-2">
                                        <div className={`w-12 h-12 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:scale-110 transition-transform duration-300 ${meta.color}`}>
                                            {meta.icon}
                                        </div>

                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className={`text-sm font-semibold truncate pr-4 ${notif.isRead ? "text-slate-300" : "text-white"}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                        {notif.message}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap mt-1 flex-shrink-0">
                                                    {notif.time}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.color} border border-white/5`}>
                                                    {notif.type}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notif.isRead && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center hover:bg-teal-500 hover:text-white transition-all"
                                                    title="Mark as read"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(notif.id)}
                                                className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                                                title="Delete notification"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

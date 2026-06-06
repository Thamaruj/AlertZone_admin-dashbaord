"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = "Report" | "Alert" | "Upvote" | "Comment";

export type ClientNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  time: string;
  isRead: boolean;
  reportId?: string;
};

// ─── Constants & Meta ─────────────────────────────────────────────────────────

const typeMeta: Record<NotificationType, { color: string; bg: string; icon: React.ReactNode }> = {
  Comment: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  Report: {
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  Upvote: {
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  Alert: {
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mapDbType = (dbType: string): NotificationType => {
  if (dbType === "status_change") return "Report";
  if (dbType === "upvote") return "Upvote";
  if (dbType === "badge_earned") return "Upvote";
  if (dbType === "comment" || dbType === "new_comment") return "Comment";
  if (dbType === "system" || dbType === "alert") return "Alert";
  
  // Fallbacks
  if (dbType === "Report" || dbType === "Alert" || dbType === "Upvote" || dbType === "Comment") {
    return dbType as NotificationType;
  }
  return "Alert";
};

const formatTime = (createdAt: any) => {
  if (!createdAt) return "Just now";
  let date: Date;
  
  if (typeof createdAt.toDate === "function") {
    date = createdAt.toDate();
  } else if (createdAt instanceof Date) {
    date = createdAt;
  } else if (createdAt?.seconds) {
    date = new Date(createdAt.seconds * 1000);
  } else {
    date = new Date(createdAt);
  }

  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 0) return "Just now";

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
};

// ─── Toast Sub-Component ──────────────────────────────────────────────────────

function Toast({
  type,
  message,
  onDismiss,
}: {
  type: "success" | "error";
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-start gap-3.5 px-4.5 py-3.5 rounded-xl border text-xs font-semibold animate-slide-up shadow-2xl ${
        type === "success"
          ? "bg-teal-500/10 border-teal-500/20 text-teal-300 shadow-teal-950/20"
          : "bg-red-500/10 border-red-500/20 text-red-300 shadow-red-950/20"
      }`}
    >
      {type === "success" ? (
        <svg className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span className="flex-1 leading-relaxed">{message}</span>
      <button onClick={onDismiss} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer p-0.5 rounded hover:bg-white/5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Notifications() {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"All" | "Unread" | NotificationType>("Unread");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Broadcast states
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: "", body: "", type: "system" });
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Poll /api/notifications/recent?full=true via Admin SDK to avoid Firestore permission errors.
  // The admin dashboard uses cookie-based JWT auth, so request.auth == null in Firestore rules,
  // meaning all direct client-side reads are blocked.
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/recent?full=true", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const list: ClientNotification[] = (data.notifications ?? []).map((n: any) => ({
        id: n.id,
        title: n.title ?? "Notification",
        message: n.body ?? "",
        type: mapDbType(n.type),
        time: formatTime(n.createdAt),
        isRead: n.isRead ?? false,
        reportId: n.reportId ?? undefined,
      }));
      setNotifications(list);
    } catch { /* non-critical */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // 2. Auto dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredNotifications = notifications.filter((n) => {
    if (selectedTab === "All") return n.type !== "Alert";
    if (selectedTab === "Unread") return !n.isRead;
    return n.type === selectedTab;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch (e) {
      console.error("❌ Error marking notification as read:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unread.map((n) => n.id) }),
      });
    } catch (e) {
      console.error("❌ Error marking all as read:", e);
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (e) {
      console.error("❌ Error deleting notification:", e);
    }
  };
 
  const handleNotificationClick = async (notif: ClientNotification) => {
    if (!notif.reportId) return;
 
    // Mark as read automatically when clicked
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
 
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      const body = await res.json();
      const reportsList = body.reports ?? body ?? [];
      const found = reportsList.find((r: any) => r.id === notif.reportId);
      
      if (found) {
        if (typeof window !== "undefined") {
          (window as any).pendingReportDetail = found;
          window.dispatchEvent(new CustomEvent("changeNavTab", { detail: "reports" }));
          window.dispatchEvent(new CustomEvent("openReportDetail", { detail: { report: found } }));
        }
      } else {
        alert("The reported issue could not be found or has been deleted.");
      }
    } catch (err: any) {
      console.error("Error opening report from notification:", err);
      alert("Failed to load report details.");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.body.trim()) return;

    setBroadcastLoading(true);
    setToast(null);

    try {
      const response = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastForm.title.trim(),
          body: broadcastForm.body.trim(),
          type: broadcastForm.type,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error ?? "Failed to send system broadcast.");

      setToast({
        type: "success",
        message: `Megaphone broadcast sent successfully to ${resData.notifiedUsers} citizens! (${resData.pushedNotifications} pushes delivered)`,
      });

      setBroadcastForm({ title: "", body: "", type: "system" });
      setShowBroadcastModal(false);
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.message || "An unexpected error occurred during broadcast execution.",
      });
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      {/* Toast Alert */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />
      )}

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

        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className={`flex-1 md:flex-none justify-center px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              unreadCount === 0
                ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Mark All as Read
          </button>
          
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg shadow-lg shadow-teal-900/40 hover:from-teal-400 hover:to-cyan-400 transition-all active:scale-[0.98] flex items-center gap-2 text-xs font-semibold cursor-pointer"
            title="Broadcast Megaphone Alert"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Broadcast Alert
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-slide-up stagger-1 flex-shrink-0 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* User Notifications */}
        <div className="flex items-center gap-1 p-1 bg-[#0f2233]/60 backdrop-blur-md border border-white/5 rounded-xl w-max">
          {["Unread", "All", "Report", "Upvote", "Comment"].map((tab) => {
            const isSelected = selectedTab === tab;
            let count = 0;
            if (tab === "All") count = notifications.filter((n) => n.type !== "Alert").length;
            else if (tab === "Unread") count = unreadCount;
            else count = notifications.filter((n) => n.type === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`flex-shrink-0 px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {tab}
                {count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>

        {/* Admin Alerts (Separated) */}
        <div className="flex items-center gap-1 p-1 bg-rose-500/5 backdrop-blur-md border border-rose-500/10 rounded-xl w-max">
          <button
            onClick={() => setSelectedTab("Alert")}
            className={`flex-shrink-0 px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedTab === "Alert"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10"
            }`}
            title="Admin-Sent Broadcasts & Alerts"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Sent Alerts
            {notifications.filter((n) => n.type === "Alert").length > 0
              ? ` (${notifications.filter((n) => n.type === "Alert").length})`
              : ""}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto animate-slide-up stagger-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center h-full">
            <svg className="w-8 h-8 animate-spin text-teal-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-400 text-xs mt-3">Loading active notification logs...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center h-full">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-4 opacity-50 relative">
              📭
              {selectedTab === "Unread" && unreadCount === 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(20,184,166,0.5)]">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="text-slate-200 font-semibold">
              {selectedTab === "Unread" ? "You're all caught up!" : "No notifications found"}
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              {selectedTab === "Unread"
                ? "You have read all your notifications."
                : "There are no notifications matching the selected filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            {filteredNotifications.map((notif) => {
              const meta = typeMeta[notif.type] || typeMeta.Alert;
              return (
                <div
                  key={notif.id}
                  onClick={() => notif.reportId && handleNotificationClick(notif)}
                  className={`group relative bg-[#0f2233]/80 backdrop-blur-xl border rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                    notif.reportId ? "cursor-pointer hover:border-teal-500/40" : "border-white/5"
                  } ${
                    notif.isRead
                      ? "opacity-85 hover:opacity-100 hover:border-white/10"
                      : "border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.05)] hover:border-teal-500/50"
                  }`}
                >
                  {/* Unread Indicator */}
                  {!notif.isRead && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-1/2 bg-teal-400 rounded-r-full shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                  )}
 
                  <div className="flex items-start gap-3 sm:gap-4 pl-1 sm:pl-2">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:scale-110 transition-transform duration-300 ${meta.bg} ${meta.color}`}
                    >
                      {meta.icon}
                    </div>
 
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`text-sm font-semibold truncate flex-1 ${
                            notif.isRead ? "text-slate-300" : "text-white"
                          }`}
                        >
                          {notif.title}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap mt-0.5 sm:mt-1 flex-shrink-0">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
 
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.color} border border-white/5`}
                          >
                            {notif.type}
                          </span>
                          {notif.reportId && (
                            <span className="text-[10px] text-teal-400 font-semibold group-hover:underline flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Click to view issue
                            </span>
                          )}
                        </div>
 
                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          {!notif.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notif.id);
                              }}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center hover:bg-teal-500 hover:text-white transition-all cursor-pointer"
                              title="Mark as read"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(notif.id);
                            }}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                            title="Delete notification log"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBroadcastModal(false)}
          />
          <div className="relative bg-[#0f2233] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-black/80 z-10 animate-slide-up">
            {/* Mega glow border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />

            <div className="flex items-center gap-3.5 pb-4 border-b border-white/5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Send System Broadcast</h3>
                <p className="text-xs text-slate-400 mt-0.5">Dispatches push notifications & logs in-app messages to all citizens.</p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Broadcast Type</label>
                <select
                  value={broadcastForm.type}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200 [&>option]:bg-[#0d1f2d] [&>option]:text-white"
                >
                  <option value="system">System Message (Info updates, app maintenance)</option>
                  <option value="alert">High Alert Warning (Weather warnings, road blocks)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extreme Weather Warning or App Maintenance"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alert Body Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide instructions or description of this broadcast alert..."
                  value={broadcastForm.body}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200 resize-none"
                />
              </div>

              <div className="flex w-full gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastLoading}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-teal-950/40 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {broadcastLoading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending Broadcast…
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Broadcast
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative bg-[#0f2233] border border-rose-500/20 rounded-2xl max-w-sm w-full p-6 shadow-2xl shadow-rose-900/20 z-10 animate-slide-up text-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
            
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Delete Notification?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              This action cannot be undone. Are you sure you want to permanently remove this notification from your log?
            </p>
            <div className="flex gap-3 relative z-10">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-900/40 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

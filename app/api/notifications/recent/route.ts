// app/api/notifications/recent/route.ts
// GET /api/notifications/recent
//   ?since=<ISO>   — for sidebar badge: returns only admin notifications newer than timestamp + unreadCount
//   ?full=true     — for the Notifications page: returns ALL 100 most recent notifications (all recipients)
//
// Uses Firebase Admin SDK to bypass Firestore Security Rules.
// The admin dashboard uses cookie-based JWT auth, so request.auth == null in Firestore rules,
// meaning all direct client-side Firestore reads are blocked.

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase-admin";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) return null;
  return session;
}

function serializeTimestamp(val: any): string | null {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate().toISOString();
  return new Date(val).toISOString();
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const full = searchParams.get("full") === "true";
    const sinceDate = since ? new Date(since) : null;

    // ── Unread count: admin-targeted notifications only (for the sidebar badge) ──
    const unreadSnap = await adminDb
      .collection("notifications")
      .where("recipientUid", "==", "admin")
      .where("isRead", "==", false)
      .get();

    const unreadCount = unreadSnap.size;

    if (full) {
      // ── Full mode: return ALL recent notifications for the Notifications page ──
      const snap = await adminDb
        .collection("notifications")
        .where("recipientUid", "==", "admin")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      const notifications = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type ?? "System",
          title: data.title ?? "Notification",
          body: data.body ?? "",
          reportId: data.reportId ?? null,
          isRead: data.isRead ?? false,
          recipientUid: data.recipientUid ?? null,
          createdAt: serializeTimestamp(data.createdAt),
        };
      });

      return NextResponse.json({ notifications, unreadCount });
    }

    // ── Polling mode: only admin-targeted notifications newer than `since` ──
    const recentSnap = await adminDb
      .collection("notifications")
      .where("recipientUid", "==", "admin")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notifications = recentSnap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type,
          title: data.title,
          body: data.body,
          reportId: data.reportId ?? null,
          isRead: data.isRead ?? false,
          createdAt: serializeTimestamp(data.createdAt),
        };
      })
      .filter((n) => {
        if (!sinceDate || !n.createdAt) return true;
        return new Date(n.createdAt).getTime() > sinceDate.getTime();
      });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error("❌ GET /api/notifications/recent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

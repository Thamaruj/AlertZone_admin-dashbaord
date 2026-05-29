// app/api/notifications/recent/route.ts
// GET /api/notifications/recent?since=<ISO timestamp>
// Returns recent admin notifications (recipientUid === "admin") created AFTER the given timestamp.
// Uses Admin SDK — bypasses Firestore security rules and composite index requirements.

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sinceParam = req.nextUrl.searchParams.get("since");
  const sinceDate = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 10_000); // default: last 10s

  try {
    // Fetch recent admin notifications ordered by createdAt desc.
    // Filter recipientUid in-memory to avoid composite index requirement.
    const snapshot = await adminDb
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notifications = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt;
        const createdDate: Date =
          createdAt && typeof createdAt.toDate === "function"
            ? createdAt.toDate()
            : new Date(createdAt);
        return {
          id: doc.id,
          recipientUid: data.recipientUid,
          title: data.title ?? "Notification",
          body: data.body ?? "",
          type: data.type ?? "system",
          reportId: data.reportId ?? null,
          isRead: data.isRead ?? false,
          createdAt: createdDate.toISOString(),
        };
      })
      // Only admin notifications newer than `since`
      .filter(
        (n) =>
          n.recipientUid === "admin" && new Date(n.createdAt) > sinceDate
      );

    // Unread count (all admin unread, not just recent)
    const unreadSnapshot = await adminDb
      .collection("notifications")
      .where("recipientUid", "==", "admin")
      .where("isRead", "==", false)
      .get();

    return NextResponse.json({
      notifications,
      unreadCount: unreadSnapshot.size,
    });
  } catch (error: any) {
    console.error("❌ GET /api/notifications/recent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// app/api/notifications/mark-all-read/route.ts
// POST /api/notifications/mark-all-read
// Marks all unread admin-side notifications as read in a single batch.
// Uses Firebase Admin SDK to bypass Firestore Security Rules.

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Accept an optional array of specific IDs to mark as read, or mark all unread
    let ids: string[] = [];
    try {
      const body = await req.json();
      if (Array.isArray(body.ids)) ids = body.ids;
    } catch {
      // No body or invalid JSON — will mark all unread below
    }

    let docsToUpdate;
    if (ids.length > 0) {
      // Mark specific IDs
      docsToUpdate = ids.map((id) => adminDb.collection("notifications").doc(id));
    } else {
      // Mark all unread notifications
      const snap = await adminDb
        .collection("notifications")
        .where("isRead", "==", false)
        .get();
      docsToUpdate = snap.docs.map((d) => d.ref);
    }

    if (docsToUpdate.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    // Firestore batch allows max 500 writes — chunk if needed
    const BATCH_SIZE = 400;
    for (let i = 0; i < docsToUpdate.length; i += BATCH_SIZE) {
      const chunk = docsToUpdate.slice(i, i + BATCH_SIZE);
      const batch = adminDb.batch();
      chunk.forEach((ref) => batch.update(ref, { isRead: true }));
      await batch.commit();
    }

    return NextResponse.json({ success: true, updated: docsToUpdate.length });
  } catch (error: any) {
    console.error("❌ POST /api/notifications/mark-all-read error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}

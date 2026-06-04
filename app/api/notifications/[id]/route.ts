// app/api/notifications/[id]/route.ts
// PATCH /api/notifications/[id]  — Mark a single notification as read
// DELETE /api/notifications/[id] — Delete a notification
//
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
  }

  try {
    await adminDb.collection("notifications").doc(id).update({ isRead: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`❌ PATCH /api/notifications/${id} error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
  }

  try {
    await adminDb.collection("notifications").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`❌ DELETE /api/notifications/${id} error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to delete notification" },
      { status: 500 }
    );
  }
}

// app/api/admin-activities/route.ts
// GET /api/admin-activities?adminId={id}
// Fetch activity logs for a specific admin.
// Admins can only view their own logs; superadmins can view any admin's logs.

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

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get("adminId");

  if (!adminId) {
    return NextResponse.json({ error: "adminId parameter is required" }, { status: 400 });
  }

  // Enforce security: normal admins can only view their own logs
  if (session.role !== "superadmin" && session.id !== adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await adminDb
      .collection("adminActivityLogs")
      .where("adminId", "==", adminId)
      .get();

    const logs = snapshot.docs.map((doc) => {
      const data = doc.data();
      const rawTimestamp = data.timestamp;
      const timestamp = rawTimestamp?.toDate
        ? rawTimestamp.toDate().toISOString()
        : rawTimestamp;

      return {
        id: doc.id,
        ...data,
        timestamp,
        _rawTime: rawTimestamp?.toDate
          ? rawTimestamp.toDate().getTime()
          : (rawTimestamp ? new Date(rawTimestamp).getTime() : 0),
      };
    });

    // Sort descending by timestamp and limit to 50
    logs.sort((a, b) => b._rawTime - a._rawTime);
    const limitedLogs = logs.slice(0, 50).map(({ _rawTime, ...rest }) => rest);

    return NextResponse.json({ logs: limitedLogs });
  } catch (error: any) {
    console.error("❌ GET /api/admin-activities error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve activity logs" },
      { status: 500 }
    );
  }
}

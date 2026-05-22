// app/api/users/[id]/reports/route.ts
// GET /api/users/[id]/reports — Fetch all reports submitted by a specific user

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { getCitizenReports } from "@/lib/services/users.service";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) return null;
  return session;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    const reports = await getCitizenReports(id);
    return NextResponse.json({ reports });
  } catch (error) {
    console.error(`❌ GET /api/users/${id}/reports error:`, error);
    return NextResponse.json({ error: "Could not fetch citizen reports" }, { status: 500 });
  }
}

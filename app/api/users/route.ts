// app/api/users/route.ts
// GET /api/users — List citizen users (admin or superadmin)

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { listCitizenUsers } from "@/lib/services/users.service";

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

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const province = searchParams.get("province") || undefined;
    const district = searchParams.get("district") || undefined;

    const users = await listCitizenUsers({ search, status, province, district });
    return NextResponse.json({ users });
  } catch (error) {
    console.error("❌ GET /api/users error:", error);
    return NextResponse.json({ error: "Could not fetch citizen users" }, { status: 500 });
  }
}

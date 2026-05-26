// app/api/admin-users/route.ts
// GET  /api/admin-users — List all admin users (superadmin only)
// POST /api/admin-users — Create a new admin user (superadmin only)

import { NextRequest, NextResponse } from "next/server";
import {
  verifySessionToken,
  listAdminUsers,
  createAdminUser,
  SESSION_COOKIE_NAME,
} from "@/lib/services/auth.service";
import type { CreateAdminUserRequest } from "@/lib/types/auth";
import { logAdminActivity } from "@/lib/services/activity.service";

async function requireSuperadmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || session.role !== "superadmin") return null;
  return session;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireSuperadmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await listAdminUsers();
    // Never return password hashes to client
    const safeUsers = users.map(({ passwordHash: _ph, ...rest }) => rest);
    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error("❌ GET /api/admin-users error:", error);
    return NextResponse.json({ error: "Could not fetch admin users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSuperadmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: CreateAdminUserRequest = await req.json();

    if (!body.username?.trim() || !body.password || !body.displayName?.trim()) {
      return NextResponse.json(
        { error: "username, displayName, and password are required" },
        { status: 400 }
      );
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const newUser = await createAdminUser({
      username: body.username,
      displayName: body.displayName,
      password: body.password,
      role: body.role,
      province: (body as any).province,
      district: (body as any).district,
      lga: (body as any).lga,
      scope: (body as any).scope,
    }, session.username);

    // Log admin creation activity
    await logAdminActivity(
      session.id,
      session.username,
      session.displayName,
      "admin_created",
      `Created admin user: @${body.username} (${body.role})`
    );

    const { passwordHash: _ph, ...safeUser } = newUser;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create admin user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

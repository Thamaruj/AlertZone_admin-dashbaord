// app/api/admin-users/[id]/route.ts
// PATCH  /api/admin-users/[id] — Update admin user (activate/deactivate, change role)
// DELETE /api/admin-users/[id] — Hard-delete admin user (superadmin only)

import { NextRequest, NextResponse } from "next/server";
import {
  verifySessionToken,
  updateAdminUser,
  deleteAdminUser,
  SESSION_COOKIE_NAME,
} from "@/lib/services/auth.service";

async function requireSuperadmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || session.role !== "superadmin") return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSuperadmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const allowed = ["isActive", "displayName", "role"] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await updateAdminUser(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ PATCH /api/admin-users/[id] error:", error);
    return NextResponse.json({ error: "Could not update admin user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSuperadmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    await deleteAdminUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ DELETE /api/admin-users/[id] error:", error);
    return NextResponse.json({ error: "Could not delete admin user" }, { status: 500 });
  }
}

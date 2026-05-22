// app/api/users/[id]/route.ts
// PATCH /api/users/[id] — Update citizen user status (suspend/activate)

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { updateCitizenStatus } from "@/lib/services/users.service";
import { adminDb } from "@/lib/firebase-admin";

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
    const docSnap = await adminDb.collection("users").doc(id).get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user: { uid: docSnap.id, ...docSnap.data() } });
  } catch (error) {
    console.error(`❌ GET /api/users/${id} error:`, error);
    return NextResponse.json({ error: "Could not retrieve user" }, { status: 500 });
  }
}

export async function PATCH(
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
    const { status } = await req.json();
    if (status !== "active" && status !== "suspended") {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    await updateCitizenStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`❌ PATCH /api/users/${id} error:`, error);
    return NextResponse.json({ error: "Could not update citizen status" }, { status: 500 });
  }
}

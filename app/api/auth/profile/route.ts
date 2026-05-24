// app/api/auth/profile/route.ts
// PATCH /api/auth/profile — Allow the currently logged-in admin (non-superadmin) to update
// their own display name and/or password. Re-issues the JWT cookie with updated displayName.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  verifySessionToken,
  createSessionToken,
  buildSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase-admin";
import { ADMIN_USERS_COLLECTION } from "@/lib/constants/auth";

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  // 1. Verify session
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  // 2. Superadmin cannot change their profile via the UI
  if (session.role === "superadmin") {
    return NextResponse.json(
      { error: "Superadmin credentials are managed via environment variables." },
      { status: 403 }
    );
  }

  // 3. Parse body
  const body: {
    displayName?: string;
    currentPassword?: string;
    newPassword?: string;
  } = await req.json();

  const updates: Record<string, unknown> = {};
  let newDisplayName = session.displayName;

  // 4. Display name update
  if (body.displayName !== undefined) {
    const trimmed = body.displayName.trim();
    if (trimmed.length < 2) {
      return NextResponse.json(
        { error: "Display name must be at least 2 characters." },
        { status: 400 }
      );
    }
    updates.displayName = trimmed;
    newDisplayName = trimmed;
  }

  // 5. Password change
  if (body.newPassword !== undefined) {
    if (!body.currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to set a new password." },
        { status: 400 }
      );
    }
    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Fetch stored hash
    const docSnap = await adminDb
      .collection(ADMIN_USERS_COLLECTION)
      .doc(session.id)
      .get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
    }

    const data = docSnap.data()!;
    const passwordMatch = await bcrypt.compare(body.currentPassword, data.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    updates.passwordHash = await bcrypt.hash(body.newPassword, 12);
  }

  // 6. Apply updates if any
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    await adminDb.collection(ADMIN_USERS_COLLECTION).doc(session.id).update(updates);
  } catch (error) {
    console.error("❌ PATCH /api/auth/profile error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }

  // 7. Re-issue JWT cookie with updated displayName so sidebar refreshes
  const newSession = {
    id: session.id,
    username: session.username,
    displayName: newDisplayName,
    role: session.role,
    isActive: session.isActive,
  };

  const newToken = await createSessionToken(newSession, false);
  const cookieHeader = buildSessionCookie(newToken, false);

  const response = NextResponse.json({
    success: true,
    displayName: newDisplayName,
  });

  response.headers.set("Set-Cookie", cookieHeader);
  return response;
}

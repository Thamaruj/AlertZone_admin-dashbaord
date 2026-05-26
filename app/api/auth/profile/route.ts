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
import { adminDb, admin } from "@/lib/firebase-admin";
import { ADMIN_USERS_COLLECTION } from "@/lib/constants/auth";
import { logAdminActivity } from "@/lib/services/activity.service";

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

  // 2. Parse body
  const body: {
    displayName?: string;
    currentPassword?: string;
    newPassword?: string;
    avatarUrl?: string | null;
  } = await req.json();

  // 3. Superadmin cannot change password or display name via profile API
  if (session.id === "superadmin" && (body.displayName !== undefined || body.newPassword !== undefined)) {
    return NextResponse.json(
      { error: "Superadmin credentials are managed via environment variables." },
      { status: 403 }
    );
  }

  const updates: Record<string, unknown> = {};
  let newDisplayName = session.displayName;
  let isAvatarUpdate = false;
  let isProfileUpdate = false;

  // 3. Avatar update
  if (body.avatarUrl !== undefined) {
    updates.avatarUrl = body.avatarUrl;
    isAvatarUpdate = true;
  }

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
    isProfileUpdate = true;
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

    // Fetch stored hash (only if not superadmin)
    if (session.id !== "superadmin") {
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
      isProfileUpdate = true;
    }
  }

  // 6. Apply updates if any
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    if (session.id === "superadmin") {
      // Save superadmin profile details (avatarUrl) to superadmin doc
      await adminDb
        .collection(ADMIN_USERS_COLLECTION)
        .doc("superadmin")
        .set(updates, { merge: true });
    } else {
      await adminDb.collection(ADMIN_USERS_COLLECTION).doc(session.id).update(updates);
    }

    // Log activities
    if (isAvatarUpdate) {
      await logAdminActivity(
        session.id,
        session.username,
        session.displayName,
        "avatar_updated",
        "Updated profile picture"
      );
    }
    if (isProfileUpdate) {
      await logAdminActivity(
        session.id,
        session.username,
        session.displayName,
        "profile_updated",
        "Updated display name or password"
      );
    }
  } catch (error) {
    console.error("❌ PATCH /api/auth/profile error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }

  // 7. Re-issue JWT cookie with updated values so UI matches
  const newSession = {
    id: session.id,
    username: session.username,
    displayName: newDisplayName,
    role: session.role,
    isActive: session.isActive,
    province: session.province,
    district: session.district,
    lga: session.lga,
    scope: session.scope,
    avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : session.avatarUrl,
    loginLogId: session.loginLogId,
  };

  const newToken = await createSessionToken(newSession, false);
  const cookieHeader = buildSessionCookie(newToken, false);

  const response = NextResponse.json({
    success: true,
    displayName: newDisplayName,
    avatarUrl: newSession.avatarUrl,
  });

  response.headers.set("Set-Cookie", cookieHeader);
  return response;
}

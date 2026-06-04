// app/api/auth/session/route.ts
// GET /api/auth/session
// Validates the session cookie and returns the current admin user.
// Used by AuthContext on mount to restore an existing session.

import { NextRequest, NextResponse } from "next/server";
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
  buildClearSessionCookie,
} from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase-admin";
import { ADMIN_USERS_COLLECTION } from "@/lib/constants/auth";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // If not superadmin, check in Firestore if the account is still active
  if (session.id !== "superadmin") {
    try {
      const userDoc = await adminDb.collection(ADMIN_USERS_COLLECTION).doc(session.id).get();
      if (!userDoc.exists || userDoc.data()?.isActive === false) {
        const res = NextResponse.json({ user: null }, { status: 401 });
        res.headers.set("Set-Cookie", buildClearSessionCookie());
        return res;
      }

      const data = userDoc.data()!;
      // Merge latest Firestore details into session returned to client
      session.displayName = data.displayName ?? session.displayName;
      session.province = data.province ?? "";
      session.district = data.district ?? "";
      session.lga = data.lga ?? "";
      session.scope = data.scope ?? "all";
      session.avatarUrl = data.avatarUrl ?? null;
      session.requirePasswordChange = data.requirePasswordChange ?? false;
    } catch (error) {
      console.error("❌ Session active check error:", error);
      return NextResponse.json({ user: null }, { status: 500 });
    }
  } else {
    // For hardcoded superadmin, see if there is extra doc inside adminUsers/superadmin
    try {
      const userDoc = await adminDb.collection(ADMIN_USERS_COLLECTION).doc("superadmin").get();
      if (userDoc.exists) {
        const data = userDoc.data()!;
        session.avatarUrl = data.avatarUrl ?? null;
        session.province = data.province ?? "";
        session.district = data.district ?? "";
        session.lga = data.lga ?? "";
        session.scope = data.scope ?? "all";
        session.requirePasswordChange = data.requirePasswordChange ?? false;
      } else {
        session.requirePasswordChange = true;
      }
    } catch (e) {
      console.error("❌ Superadmin doc load error:", e);
    }
  }

  // Return session without internal JWT fields
  const { iat, exp, ...user } = session;
  void iat; // explicitly unused
  void exp;

  return NextResponse.json({ user });
}

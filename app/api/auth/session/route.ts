// app/api/auth/session/route.ts
// GET /api/auth/session
// Validates the session cookie and returns the current admin user.
// Used by AuthContext on mount to restore an existing session.

import { NextRequest, NextResponse } from "next/server";
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/services/auth.service";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Return session without internal JWT fields
  const { iat, exp, ...user } = session;
  void iat; // explicitly unused
  void exp;

  return NextResponse.json({ user });
}

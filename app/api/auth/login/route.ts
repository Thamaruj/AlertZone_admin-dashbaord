// app/api/auth/login/route.ts
// POST /api/auth/login
// Validates admin credentials server-side and sets a secure HttpOnly session cookie.

import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminCredentials,
  createSessionToken,
  buildSessionCookie,
} from "@/lib/services/auth.service";
import type { LoginRequest, LoginResponse } from "@/lib/types/auth";
import { logAdminLogin, logAdminActivity, getSimulatedLocation } from "@/lib/services/activity.service";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: LoginRequest = await req.json();
    const { username, password, keepLoggedIn } = body;

    if (!username?.trim() || !password) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const { session, error } = await validateAdminCredentials(
      username.trim(),
      password
    );

    if (!session) {
      // Use a generic message — never reveal whether the username exists
      return NextResponse.json<LoginResponse>(
        { success: false, error: error ?? "Invalid credentials" },
        { status: 401 }
      );
    }

    // Get client IP and User Agent
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown Browser";

    // Log the login event
    const loginLogId = await logAdminLogin(session.id, session.username, session.displayName, ip, userAgent);
    const location = getSimulatedLocation(ip);

    // Write login activity
    await logAdminActivity(
      session.id,
      session.username,
      session.displayName,
      "login",
      `Logged in successfully from ${location}`
    );

    const sessionWithLog = { ...session, loginLogId };
    const token = await createSessionToken(sessionWithLog, keepLoggedIn ?? false);
    const cookie = buildSessionCookie(token, keepLoggedIn ?? false);

    const response = NextResponse.json<LoginResponse>({
      success: true,
      user: sessionWithLog,
    });

    response.headers.set("Set-Cookie", cookie);
    return response;
  } catch (error) {
    console.error("❌ /api/auth/login error:", error);
    return NextResponse.json<LoginResponse>(
      { success: false, error: "An internal error occurred. Please try again." },
      { status: 500 }
    );
  }
}

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

    const token = await createSessionToken(session, keepLoggedIn ?? false);
    const cookie = buildSessionCookie(token, keepLoggedIn ?? false);

    const response = NextResponse.json<LoginResponse>({
      success: true,
      user: session,
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

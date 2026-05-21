// app/api/auth/logout/route.ts
// POST /api/auth/logout
// Clears the session cookie.

import { NextResponse } from "next/server";
import { buildClearSessionCookie } from "@/lib/services/auth.service";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", buildClearSessionCookie());
  return response;
}

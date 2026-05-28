// app/api/auth/logout/route.ts
// POST /api/auth/logout
// Clears the session cookie, logs activity, and records logout time.

import { NextRequest, NextResponse } from "next/server";
import {
  buildClearSessionCookie,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/services/auth.service";
import { logAdminLogout, logAdminActivity } from "@/lib/services/activity.service";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (token) {
    try {
      const session = await verifySessionToken(token);
      if (session) {
        // Record logout timestamp in login logs
        if (session.loginLogId) {
          await logAdminLogout(session.loginLogId);
        }
        
        // Log logout event in activities
        await logAdminActivity(
          session.id,
          session.username,
          session.displayName,
          "logout",
          "Logged out of the administration portal"
        );
      }
    } catch (error) {
      console.error("❌ Error during logout logging:", error);
    }
  }

  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", buildClearSessionCookie());
  return response;
}

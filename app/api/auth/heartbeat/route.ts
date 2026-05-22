import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb, admin } from "@/lib/firebase-admin";
import { ADMIN_USERS_COLLECTION } from "@/lib/constants/auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // superadmin is hardcoded server-side and has no database document to update
    if (session.id === "superadmin") {
      return NextResponse.json({ success: true, isActive: true, isSuperadmin: true });
    }

    const userDocRef = adminDb.collection(ADMIN_USERS_COLLECTION).doc(session.id);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const isActive = userData?.isActive !== false;

    if (isActive) {
      await userDocRef.update({
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true, isActive });
  } catch (error) {
    console.error("❌ /api/auth/heartbeat error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

// app/api/reports/[id]/upvotes/route.ts
// GET /api/reports/[id]/upvotes
// Returns all upvoters on a report, with upvoter profile data.
// Uses Firebase Admin SDK — bypasses Firestore Security Rules (admin dashboard uses
// cookie-based JWT auth, so client-side SDK reads are always blocked by rules).

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase-admin";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) return null;
  return session;
}

function serializeTimestamp(val: any): string | null {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate().toISOString();
  return new Date(val).toISOString();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Report ID required" }, { status: 400 });
  }

  try {
    // Fetch upvotes subcollection (doc ID = upvoter uid)
    const upvotesSnap = await adminDb
      .collection("reports")
      .doc(id)
      .collection("upvotes")
      .get();

    // Collect all UIDs to batch-fetch profiles
    const uids = upvotesSnap.docs.map((d) => d.id).filter(Boolean);

    // Batch-fetch user profiles
    const profileMap: Record<string, any> = {};
    if (uids.length > 0) {
      const userFetches = uids.map((uid) =>
        adminDb.collection("users").doc(uid).get()
      );
      const userDocs = await Promise.all(userFetches);
      userDocs.forEach((snap) => {
        if (snap.exists) {
          profileMap[snap.id] = { uid: snap.id, ...snap.data() };
        }
      });
    }

    const upvoters = upvotesSnap.docs.map((d) => {
      const uid = d.id;
      const data = d.data();
      const upvoterUser = profileMap[uid] ?? null;
      return {
        uid,
        name: upvoterUser?.fullName || "Anonymous Citizen",
        avatar: upvoterUser?.avatarUrl || "",
        upvoterUser,
        createdAt: serializeTimestamp(data.createdAt),
      };
    });

    return NextResponse.json({ upvoters });
  } catch (error: any) {
    console.error(`❌ GET /api/reports/${id}/upvotes error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch upvoters" },
      { status: 500 }
    );
  }
}

// app/api/reports/[id]/comments/route.ts
// GET /api/reports/[id]/comments
// Returns all comments on a report, with commenter profile data.
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
    // Fetch comments subcollection ordered by createdAt asc
    const commentsSnap = await adminDb
      .collection("reports")
      .doc(id)
      .collection("comments")
      .orderBy("createdAt", "asc")
      .get();

    // Collect all unique commenter UIDs to batch-fetch profiles
    const uids = new Set<string>();
    commentsSnap.docs.forEach((d) => {
      const uid = d.data().uid;
      if (uid) uids.add(uid);
    });

    // Batch-fetch user profiles
    const profileMap: Record<string, any> = {};
    if (uids.size > 0) {
      const userFetches = Array.from(uids).map((uid) =>
        adminDb.collection("users").doc(uid).get()
      );
      const userDocs = await Promise.all(userFetches);
      userDocs.forEach((snap) => {
        if (snap.exists) {
          profileMap[snap.id] = { uid: snap.id, ...snap.data() };
        }
      });
    }

    const comments = commentsSnap.docs.map((d) => {
      const data = d.data();
      const commenterUser = data.uid ? profileMap[data.uid] ?? null : null;
      return {
        id: d.id,
        body: data.body || "",
        upvoteCount: data.upvoteCount || 0,
        createdAt: serializeTimestamp(data.createdAt),
        uid: data.uid ?? null,
        commenterName: commenterUser?.fullName || "Anonymous Citizen",
        commenterAvatar: commenterUser?.avatarUrl || "",
        commenterUser,
      };
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error(`❌ GET /api/reports/${id}/comments error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

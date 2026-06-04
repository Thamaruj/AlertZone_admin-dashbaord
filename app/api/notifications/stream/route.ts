// app/api/notifications/stream/route.ts
// GET /api/notifications/stream — Server-Sent Events stream for real-time admin notifications
// Uses Firebase Admin SDK with single-field queries to avoid composite index requirements.
//
// ⚠️  KEY INSIGHT: Firestore requires a composite index for (where field A) + (orderBy field B).
//     We avoid this by using SINGLE-field queries only and filtering/sorting in-memory server-side.
//
//     Feed query   → orderBy("createdAt", "desc").limit(50)  then filter recipientUid === "admin" in JS
//     Count query  → where("recipientUid","==","admin") + where("isRead","==",false) — two equality
//                    filters on different fields, NO composite index needed in Firestore.

import { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let unsubscribeFeed: (() => void) | null = null;
  let unsubscribeCount: (() => void) | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      // ── Helper: send an SSE message ────────────────────────────────────────
      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // stream already closed
        }
      }

      // ── 1. Real-time admin notification feed (toast alerts) ────────────────
      // Use orderBy("createdAt") ONLY (single-field — no index needed).
      // Filter recipientUid === "admin" in-memory here on the server.
      const feedQuery = adminDb
        .collection("notifications")
        .orderBy("createdAt", "desc")
        .limit(50);

      unsubscribeFeed = feedQuery.onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type !== "added") return;

            const data = change.doc.data();

            // ⚡ Server-side filter — no composite index needed
            if (data.recipientUid !== "admin") return;

            const createdAt = data.createdAt;
            const createdDate: Date =
              createdAt && typeof createdAt.toDate === "function"
                ? createdAt.toDate()
                : new Date(createdAt);

            send("notification", {
              id: change.doc.id,
              title: data.title ?? "Notification",
              body: data.body ?? "",
              type: data.type ?? "system",
              reportId: data.reportId ?? null,
              createdAt: createdDate.toISOString(),
            });
          });
        },
        (error) => {
          console.error("❌ SSE feed listener error:", error);
          send("error", { message: error.message });
        }
      );

      // ── 2. Unread count subscription ───────────────────────────────────────
      // Two equality where-clauses on different fields → NO composite index needed.
      const countQuery = adminDb
        .collection("notifications")
        .where("recipientUid", "==", "admin")
        .where("isRead", "==", false);

      unsubscribeCount = countQuery.onSnapshot(
        (snapshot) => {
          send("unread_count", { count: snapshot.size });
        },
        (error) => {
          console.error("❌ SSE unread count listener error:", error);
        }
      );

      // Send initial heartbeat so the client knows the stream is alive
      send("connected", { ok: true });
    },

    cancel() {
      closed = true;
      unsubscribeFeed?.();
      unsubscribeCount?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable proxy buffering (Vercel / nginx)
    },
  });
}

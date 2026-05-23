// app/api/reports/[id]/route.ts
// PATCH /api/reports/[id] — Update report status (server-side to bypass client rules)

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb, admin } from "@/lib/firebase-admin";
import { ReportStatus, StatusHistoryEntry } from "@/lib/types/report";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Report ID required" }, { status: 400 });
  }

  try {
    const { status, adminId, note } = await req.json();

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const reportRef = adminDb.collection("reports").doc(id);
    const reportSnap = await reportRef.get();

    if (!reportSnap.exists) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const reportData = reportSnap.data() as any;
    const previousStatus = reportData.status;

    // Prepare status history entry matching target format
    const historyEntry: StatusHistoryEntry = {
      status: status as ReportStatus,
      changedAt: new Date().toISOString(),
      changedBy: adminId || session.id,
    };

    if (note) {
      historyEntry.note = note.trim();
    }

    // Prepare the update payload
    const updatePayload: any = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: admin.firestore.FieldValue.arrayUnion(historyEntry),
    };

    if (note) {
      updatePayload.resolutionNote = note.trim();
    }

    // Update the report
    await reportRef.update(updatePayload);

    // Create a notification for the citizen
    await adminDb.collection("notifications").add({
      recipientUid: reportData.uid,
      type: "status_change",
      title: "Report Status Updated",
      body: `Your report "${reportData.title || "Incident"}" status changed to ${status}.`,
      reportId: id,
      data: { previousStatus, newStatus: status },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // If status is RESOLVED, award contribution points and increment validated count
    if (status === "RESOLVED") {
      const userRef = adminDb.collection("users").doc(reportData.uid);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const userData = userSnap.data() || {};
        await userRef.update({
          reportsValidated: (userData.reportsValidated || 0) + 1,
          contributionPoints: (userData.contributionPoints || 0) + 10, // 10 points
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`❌ PATCH /api/reports/${id} error:`, error);
    return NextResponse.json(
      { error: error.message || "Could not update report status" },
      { status: 500 }
    );
  }
}

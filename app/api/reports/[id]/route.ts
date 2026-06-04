// app/api/reports/[id]/route.ts
// PATCH /api/reports/[id] — Update report status (server-side to bypass client rules)

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb, admin } from "@/lib/firebase-admin";
import { ReportStatus, StatusHistoryEntry } from "@/lib/types/report";
import { sendPushNotification } from "@/lib/services/push.service";
import { logAdminActivity } from "@/lib/services/activity.service";

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
    const body = await req.json();
    const { status, adminId, note, isArchived } = body;

    const reportRef = adminDb.collection("reports").doc(id);
    const reportSnap = await reportRef.get();

    if (!reportSnap.exists) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const reportData = reportSnap.data() as any;

    if (typeof isArchived === "boolean") {
      await reportRef.update({
        isArchived,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await logAdminActivity(
        session.id,
        session.username,
        session.displayName,
        isArchived ? "report_archive" : "report_unarchive",
        `${isArchived ? "Archived" : "Unarchived"} report '${reportData.title || "Incident"}' (ID: ${id})`
      );

      return NextResponse.json({ success: true });
    }

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

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

    // Log the action
    await logAdminActivity(
      session.id,
      session.username,
      session.displayName,
      "report_status_update",
      `Escalated report '${reportData.title || "Incident"}' status from ${previousStatus} to ${status}${note ? " (Note: " + note.trim() + ")" : ""}`
    );

    // Fetch the citizen user's profile for notifications and contribution updates
    const userRef = adminDb.collection("users").doc(reportData.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};

    // Create a notification for the citizen in Firestore
    await adminDb.collection("notifications").add({
      recipientUid: reportData.uid,
      type: "status_change",
      title: "Report Status Updated",
      body: `Your report "${reportData.title || "Incident"}" status changed to ${status}.`,
      reportId: id,
      data: { 
        previousStatus, 
        newStatus: status,
        latitude: reportData.location?.latitude || null,
        longitude: reportData.location?.longitude || null,
      },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send push notification if token exists
    const expoPushToken = userData?.expoPushToken || userData?.fcmToken;
    if (expoPushToken) {
      await sendPushNotification(
        expoPushToken,
        "Report Status Updated",
        `Your report "${reportData.title || "Incident"}" status changed to ${status}.`,
        {
          reportId: id,
          latitude: reportData.location?.latitude,
          longitude: reportData.location?.longitude,
        }
      );
    }

    // ── Gamification processing ──
    if (userSnap.exists) {
      let contributionPoints = userData.contributionPoints || 0;
      let reportsAccepted = userData.reportsAccepted || 0;
      let reportsResolved = userData.reportsResolved || 0;
      let reportsValidated = userData.reportsValidated || 0;
      let userUpdated = false;

      // 1. Check ASSIGNED status change (award points)
      if (status === "ASSIGNED" && !reportData.pointsAwarded) {
        contributionPoints += 10;
        reportsAccepted += 1;
        await reportRef.update({ pointsAwarded: true });
        userUpdated = true;
      }

      // 2. Check RESOLVED status change (increment resolved count)
      if (status === "RESOLVED" && !reportData.resolvedCounted) {
        reportsResolved += 1;
        reportsValidated += 1; // legacy alias
        await reportRef.update({ resolvedCounted: true });
        userUpdated = true;
      }

      // 3. Recalculate level and badges if any changes occurred
      if (userUpdated) {
        // Fetch all reports submitted by this user to compute badges accurately
        const userReportsSnap = await adminDb
          .collection("reports")
          .where("uid", "==", reportData.uid)
          .get();

        const totalReports = userReportsSnap.size;

        // Timestamps mapping
        const reportTimestamps = userReportsSnap.docs.map((doc) => {
          const rData = doc.data();
          const rawCreated = rData.createdAt;
          if (rawCreated && typeof rawCreated.toDate === "function") {
            return rawCreated.toDate();
          }
          return rawCreated ? new Date(rawCreated) : new Date();
        });

        // Badge definitions matching gamification.service.ts
        const earnedBadges: string[] = [];

        // Bronze
        if (totalReports >= 1) earnedBadges.push("first_report");
        if (reportTimestamps.some(d => {
          const lkaHour = new Date(d.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();
          return lkaHour < 7;
        })) {
          earnedBadges.push("early_bird");
        }
        if (reportTimestamps.some(d => {
          const lkaHour = new Date(d.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();
          return lkaHour >= 22;
        })) {
          earnedBadges.push("night_watch");
        }

        // Silver
        if (reportsAccepted >= 5) earnedBadges.push("accepted_5");
        if (reportsResolved >= 5) earnedBadges.push("resolved_5");
        if (contributionPoints >= 500) earnedBadges.push("points_500");

        // Gold
        if (reportsAccepted >= 25) earnedBadges.push("accepted_25");
        if (reportsResolved >= 20) earnedBadges.push("resolved_20");
        if (contributionPoints >= 2000) earnedBadges.push("points_2000");

        // Diamond
        if (reportsAccepted >= 100) earnedBadges.push("accepted_100");
        if (reportsResolved >= 50) earnedBadges.push("resolved_50");
        if (contributionPoints >= 5000) earnedBadges.push("points_5000");

        // Level calculation
        let level = 1;
        if (contributionPoints >= 1000) level = 5;
        else if (contributionPoints >= 600) level = 4;
        else if (contributionPoints >= 300) level = 3;
        else if (contributionPoints >= 100) level = 2;

        // Save back to user profile doc
        await userRef.update({
          contributionPoints,
          reportsAccepted,
          reportsResolved,
          reportsValidated,
          badges: earnedBadges,
          level,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb, admin } from "@/lib/firebase-admin";
import { sendBulkPushNotifications } from "@/lib/services/push.service";
import { logAdminActivity } from "@/lib/services/activity.service";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title, body, type } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    const notificationType = type || "system"; // fallback to system

    // 1. Fetch all citizen users
    const usersSnap = await adminDb
      .collection("users")
      .where("role", "==", "citizen")
      .get();
    
    if (usersSnap.empty) {
      return NextResponse.json({ success: true, message: "No citizens found to notify" });
    }

    const pushTokens: string[] = [];
    const batch = adminDb.batch();

    usersSnap.docs.forEach((docSnap) => {
      const userData = docSnap.data();
      const userId = docSnap.id;

      // Add to Firestore notification log in batch
      const notifRef = adminDb.collection("notifications").doc();
      batch.set(notifRef, {
        recipientUid: userId,
        type: notificationType,
        title,
        body,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Retrieve device push token if registered
      const token = userData.expoPushToken || userData.fcmToken;
      if (token) {
        pushTokens.push(token);
      }
    });

    // Commit Firestore updates in a single atomic transaction
    await batch.commit();
    console.log(`✅ Created ${usersSnap.size} in-app notifications in Firestore.`);

    // Log the broadcast action
    await logAdminActivity(
      session.id,
      session.username,
      session.displayName,
      "broadcast_sent",
      `Sent broadcast notification: "${title}"`
    );

    // 2. Dispatch push notifications in bulk to Expo push gateway
    let pushedCount = 0;
    if (pushTokens.length > 0) {
      pushedCount = await sendBulkPushNotifications(
        pushTokens,
        title,
        body,
        { type: notificationType }
      );
      console.log(`✅ Dispatched broadcast push notifications to ${pushedCount} devices.`);
    }

    // 3. Create a notification record for the admin dashboard
    await adminDb.collection("notifications").add({
      recipientUid: "admin",
      type: notificationType, // will map to "Alert" in frontend
      title: `📣 Broadcast: ${title}`,
      body: `${body}\n\n(Delivered to ${usersSnap.size} citizens, ${pushedCount} push notifications)`,
      isRead: true, // Mark as read so it doesn't increment the unread badge
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      notifiedUsers: usersSnap.size,
      pushedNotifications: pushedCount,
    });
  } catch (error: any) {
    console.error("❌ POST /api/notifications/broadcast error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process broadcast notifications" },
      { status: 500 }
    );
  }
}

/**
 * Service to handle sending push notifications to clients via the Expo Push Notification API.
 */

interface PushPayload {
  to: string;
  sound: "default" | null;
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

/**
 * Sends a single push notification via the Expo Push API.
 * 
 * @param expoPushToken The recipient's Expo Push Token (starts with ExponentPushToken)
 * @param title Notification title
 * @param body Notification message body
 * @param data Optional extra key-value payload
 * @returns boolean indicating success status
 */
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  if (!expoPushToken || !expoPushToken.startsWith("ExponentPushToken")) {
    console.warn("⚠️ Invalid or missing Expo Push Token:", expoPushToken);
    return false;
  }

  try {
    const payload: PushPayload = {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data,
      channelId: "alertzone-alerts",
      priority: "high",
    };

    console.log(`📤 Sending push notification to token ${expoPushToken.substring(0, 25)}...`);
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();
    if (response.ok) {
      console.log("✅ Push notification sent successfully:", resData);
      return true;
    } else {
      console.error("❌ Failed to send push notification. Response:", resData);
      return false;
    }
  } catch (error) {
    console.error("❌ Error sending push notification:", error);
    return false;
  }
}

/**
 * Sends bulk push notifications via the Expo Push API in a single HTTP request.
 * Expo supports batching up to 100 notifications.
 * 
 * @param expoPushTokens List of recipient tokens
 * @param title Notification title
 * @param body Notification message body
 * @param data Optional extra key-value payload
 */
export async function sendBulkPushNotifications(
  expoPushTokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<number> {
  const validTokens = expoPushTokens.filter(
    (token) => token && token.startsWith("ExponentPushToken")
  );

  if (validTokens.length === 0) {
    console.log("⚠️ No valid Expo Push Tokens found for bulk notification.");
    return 0;
  }

  try {
    // Expo allows up to 100 messages per batch
    const chunks = [];
    const chunkSize = 100;
    
    for (let i = 0; i < validTokens.length; i += chunkSize) {
      chunks.push(validTokens.slice(i, i + chunkSize));
    }

    let successCount = 0;

    for (const chunk of chunks) {
      const payloads: PushPayload[] = chunk.map((token) => ({
        to: token,
        sound: "default",
        title,
        body,
        data,
        channelId: "alertzone-alerts",
        priority: "high",
      }));

      console.log(`📤 Sending batch of ${chunk.length} push notifications...`);
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloads),
      });

      const resData = await response.json();
      if (response.ok) {
        // Expo response contains an array of status tickets
        const tickets = resData.data || [];
        const succeeded = tickets.filter((t: any) => t.status === "ok").length;
        successCount += succeeded;
        console.log(`✅ Bulk batch completed. Succeeded: ${succeeded}/${chunk.length}`);
      } else {
        console.error("❌ Failed to send bulk push notifications. Response:", resData);
      }
    }

    return successCount;
  } catch (error) {
    console.error("❌ Error sending bulk push notifications:", error);
    return 0;
  }
}

// lib/services/activity.service.ts
// Handles admin activity logging and login/logout tracking.

import { adminDb, admin } from "@/lib/firebase-admin";

/**
 * Log a specific admin action.
 */
export async function logAdminActivity(
  adminId: string,
  username: string,
  displayName: string,
  action: string,
  details: string
): Promise<void> {
  try {
    await adminDb.collection("adminActivityLogs").add({
      adminId,
      username,
      displayName,
      action,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("❌ Error logging admin activity:", error);
  }
}

/**
 * Deterministically or randomly resolve a Sri Lankan location name from an IP address.
 * Useful for local testing/demo.
 */
export function getSimulatedLocation(ip: string): string {
  const cities = [
    "Colombo, Sri Lanka",
    "Kandy, Sri Lanka",
    "Galle, Sri Lanka",
    "Gampaha, Sri Lanka",
    "Jaffna, Sri Lanka",
    "Batticaloa, Sri Lanka",
    "Negombo, Sri Lanka",
    "Kurunegala, Sri Lanka",
  ];
  
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.includes("localhost")) {
    // Return a random city for localhost to make local testing dynamic
    const idx = Math.floor(Math.random() * cities.length);
    return cities[idx];
  }

  // Hash the IP string to select a city deterministically
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ip.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % cities.length;
  return cities[index];
}

/**
 * Log a login event and return the log document ID.
 */
export async function logAdminLogin(
  adminId: string,
  username: string,
  displayName: string,
  ip: string,
  userAgent: string
): Promise<string> {
  try {
    const location = getSimulatedLocation(ip);
    const docRef = await adminDb.collection("adminLoginLogs").add({
      adminId,
      username,
      displayName,
      loginAt: admin.firestore.FieldValue.serverTimestamp(),
      logoutAt: null,
      ip,
      userAgent,
      location,
    });
    return docRef.id;
  } catch (error) {
    console.error("❌ Error logging admin login:", error);
    return "";
  }
}

/**
 * Record a logout timestamp on an active login session log.
 */
export async function logAdminLogout(loginLogId: string): Promise<void> {
  if (!loginLogId) return;
  try {
    await adminDb.collection("adminLoginLogs").doc(loginLogId).update({
      logoutAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("❌ Error logging admin logout:", error);
  }
}

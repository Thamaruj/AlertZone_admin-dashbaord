// lib/services/users.service.ts
// Server-side only service to query and manage citizen accounts.

import { adminDb } from "@/lib/firebase-admin";
import { UserProfile } from "@/lib/types/user";
import { Report } from "@/lib/types/report";

/**
 * Fetches all citizen profiles, applying optional keyword search,
 * status, province, and district filters in-memory for maximum flexibility.
 */
export async function listCitizenUsers(filters: {
  search?: string;
  status?: string;
  province?: string;
  district?: string;
} = {}): Promise<UserProfile[]> {
  try {
    const query = adminDb.collection("users").where("role", "==", "citizen");
    const snapshot = await query.get();
    
    let users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
      };
    }) as UserProfile[];

    // Filter in-memory for rich multi-criteria filtering
    if (filters.status && filters.status !== "all") {
      const statusLower = filters.status.toLowerCase();
      users = users.filter(u => u.status?.toLowerCase() === statusLower);
    }

    if (filters.province && filters.province !== "all") {
      const provLower = filters.province.toLowerCase();
      users = users.filter(u => u.province?.toLowerCase() === provLower);
    }

    if (filters.district && filters.district !== "all") {
      const distLower = filters.district.toLowerCase();
      users = users.filter(u => u.district?.toLowerCase() === distLower);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      users = users.filter(u => 
        (u.fullName || "").toLowerCase().includes(searchLower) ||
        (u.email || "").toLowerCase().includes(searchLower) ||
        (u.phoneNumber || "").toLowerCase().includes(searchLower) ||
        (u.nic || "").toLowerCase().includes(searchLower) ||
        (u.address || "").toLowerCase().includes(searchLower) ||
        (u.localGovernmentArea || "").toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation timestamp (newest first)
    users.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return users;
  } catch (error) {
    console.error("❌ listCitizenUsers service error:", error);
    throw new Error("Could not list citizen users");
  }
}

/**
 * Updates a citizen's status to either 'active' or 'suspended'.
 */
export async function updateCitizenStatus(userId: string, status: "active" | "suspended"): Promise<void> {
  try {
    await adminDb.collection("users").doc(userId).update({
      status,
      updatedAt: new Date().toISOString()
    });
    console.log(`⚡ Citizen ${userId} status updated to ${status}`);
  } catch (error) {
    console.error(`❌ updateCitizenStatus error for user ${userId}:`, error);
    throw new Error("Could not update citizen status");
  }
}

/**
 * Retrieves all reports submitted by a specific citizen.
 */
export async function getCitizenReports(userId: string): Promise<Report[]> {
  try {
    const snap = await adminDb
      .collection("reports")
      .where("uid", "==", userId)
      .get();

    const reports = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt && typeof data.createdAt.toDate === "function"
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
        updatedAt: data.updatedAt && typeof data.updatedAt.toDate === "function"
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt
      };
    }) as Report[];

    // Sort by creation date (newest first)
    reports.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return reports;
  } catch (error) {
    console.error(`❌ getCitizenReports error for user ${userId}:`, error);
    throw new Error("Could not retrieve citizen reports");
  }
}

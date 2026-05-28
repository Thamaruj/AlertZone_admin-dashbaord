// lib/types/auth.ts
// Admin authentication types for the AlertZone dashboard.
// These types are SEPARATE from the mobile app's user types.
// Admin users are stored in the `adminUsers` Firestore collection (never in `users`).

export type AdminRole = "admin" | "superadmin";

/** Stored in Firestore `adminUsers/{id}` */
export interface AdminUser {
  id: string;
  username: string; // unique login identifier
  displayName: string; // shown in UI (e.g., "Thamaruj Jayawardena")
  passwordHash: string; // bcrypt hash — NEVER plain text
  role: AdminRole;
  isActive: boolean; // superadmin can deactivate
  createdAt: Date;
  createdBy: string; // username of the superadmin who created this account
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  province?: string;
  district?: string;
  lga?: string;
  scope?: "all" | "province" | "district" | "lga";
  avatarUrl?: string | null;
}

/** Stored in the JWT session cookie */
export interface AdminSession {
  id: string; // Firestore doc ID or "superadmin" for the hardcoded account
  username: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  province?: string;
  district?: string;
  lga?: string;
  scope?: "all" | "province" | "district" | "lga";
  avatarUrl?: string | null;
  loginLogId?: string; // embedded login log document ID
  iat?: number; // JWT issued at
  exp?: number; // JWT expiry
}

/** Returned by login API */
export interface LoginResponse {
  success: boolean;
  user?: Omit<AdminSession, "iat" | "exp">;
  error?: string;
}

/** Login request payload */
export interface LoginRequest {
  username: string;
  password: string;
  keepLoggedIn?: boolean;
}

/** Payload for creating a new admin user (superadmin only) */
export interface CreateAdminUserRequest {
  username: string;
  displayName: string;
  password: string;
  role: AdminRole;
}

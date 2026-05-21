// lib/constants/auth.ts
// Auth-related constants for the AlertZone admin dashboard.

import type { AdminRole } from "@/lib/types/auth";

/** All available admin roles with display info */
export const ADMIN_ROLES: Record<
  AdminRole,
  { label: string; description: string; color: string }
> = {
  superadmin: {
    label: "Super Admin",
    description: "Full access. Can manage admin users.",
    color: "#A78BFA", // purple accent
  },
  admin: {
    label: "Admin",
    description: "Can manage reports, users, and notifications.",
    color: "#4CC2D1", // teal accent
  },
};

/** JWT cookie name */
export const SESSION_COOKIE_NAME = "az_admin_session";

/** Short session duration (no "keep me logged in") */
export const SESSION_DURATION_SHORT = 60 * 60 * 8; // 8 hours in seconds

/** Long session duration ("keep me logged in") */
export const SESSION_DURATION_LONG = 60 * 60 * 24 * 30; // 30 days in seconds

/** Firestore collection name for admin users */
export const ADMIN_USERS_COLLECTION = "adminUsers";

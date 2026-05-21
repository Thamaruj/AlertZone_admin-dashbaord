// lib/services/auth.service.ts
// Server-side only — NEVER import this in client components.
// Handles credential validation, password hashing, and JWT session tokens.

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { adminDb, admin } from "@/lib/firebase-admin";
import type {
  AdminSession,
  AdminUser,
  CreateAdminUserRequest,
} from "@/lib/types/auth";
import {
  ADMIN_USERS_COLLECTION,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_LONG,
  SESSION_DURATION_SHORT,
} from "@/lib/constants/auth";

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set in environment variables");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  session: Omit<AdminSession, "iat" | "exp">,
  keepLoggedIn: boolean
): Promise<string> {
  const durationSecs = keepLoggedIn
    ? SESSION_DURATION_LONG
    : SESSION_DURATION_SHORT;

  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + durationSecs)
    .sign(getJwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers (used by API routes)
// ---------------------------------------------------------------------------

export function buildSessionCookie(
  token: string,
  keepLoggedIn: boolean
): string {
  const maxAge = keepLoggedIn ? SESSION_DURATION_LONG : SESSION_DURATION_SHORT;
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  // Add Secure flag in production
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function buildClearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// Superadmin — hardcoded server-side (from .env.local)
// ---------------------------------------------------------------------------

function getSuperadminCredentials(): { username: string; passwordHash: string } {
  const username = process.env.SUPERADMIN_USERNAME;
  let passwordHash = process.env.SUPERADMIN_PASSWORD_HASH;

  if (!username || !passwordHash) {
    throw new Error(
      "SUPERADMIN_USERNAME or SUPERADMIN_PASSWORD_HASH is not set in .env.local"
    );
  }

  // Next.js dotenv requires escaping $ signs as \$ locally,
  // but Vercel/system env vars are read literally (retaining backslashes).
  // Clean up any escaped dollar signs to ensure it's a valid bcrypt hash.
  passwordHash = passwordHash.replace(/\\\$/g, "$");

  return { username, passwordHash };
}

function isSuperadmin(username: string): boolean {
  try {
    const creds = getSuperadminCredentials();
    return creds.username.toLowerCase() === username.toLowerCase();
  } catch {
    return false;
  }
}

async function validateSuperadmin(
  username: string,
  password: string
): Promise<AdminSession | null> {
  const creds = getSuperadminCredentials();
  if (creds.username.toLowerCase() !== username.toLowerCase()) return null;

  const match = await bcrypt.compare(password, creds.passwordHash);
  if (!match) return null;

  return {
    id: "superadmin",
    username: creds.username,
    displayName:
      process.env.SUPERADMIN_DISPLAY_NAME ?? "Super Admin",
    role: "superadmin",
    isActive: true,
  };
}

// ---------------------------------------------------------------------------
// Firestore admin users
// ---------------------------------------------------------------------------

async function validateFirestoreAdmin(
  username: string,
  password: string
): Promise<AdminSession | null> {
  try {
    const snap = await adminDb
      .collection(ADMIN_USERS_COLLECTION)
      .where("username", "==", username.toLowerCase())
      .limit(1)
      .get();

    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    const data = docSnap.data() as Omit<AdminUser, "id">;

    if (!data.isActive) return null;

    const match = await bcrypt.compare(password, data.passwordHash);
    if (!match) return null;

    // Update lastLoginAt (non-blocking)
    docSnap.ref.update({ lastLoginAt: admin.firestore.FieldValue.serverTimestamp() }).catch(
      console.error
    );

    return {
      id: docSnap.id,
      username: data.username,
      displayName: data.displayName,
      role: data.role,
      isActive: data.isActive,
    };
  } catch (error) {
    console.error("❌ validateFirestoreAdmin error:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Primary validation — tries superadmin first, then Firestore
// ---------------------------------------------------------------------------

export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<{ session: AdminSession | null; error?: string }> {
  if (!username || !password) {
    return { session: null, error: "Username and password are required" };
  }

  // 1. Check superadmin
  const superSession = await validateSuperadmin(username, password);
  if (superSession) return { session: superSession };

  // 2. If username matches superadmin but password was wrong, don't fall through
  if (isSuperadmin(username)) {
    return { session: null, error: "Invalid credentials" };
  }

  // 3. Check Firestore admin users
  const firestoreSession = await validateFirestoreAdmin(username, password);
  if (firestoreSession) return { session: firestoreSession };

  return { session: null, error: "Invalid credentials" };
}

// ---------------------------------------------------------------------------
// Admin user management (superadmin-only operations)
// ---------------------------------------------------------------------------

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  try {
    const snap = await adminDb.collection(ADMIN_USERS_COLLECTION).get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        username: data.username,
        displayName: data.displayName,
        passwordHash: data.passwordHash,
        role: data.role,
        isActive: data.isActive,
        createdAt:
          data.createdAt && typeof data.createdAt.toDate === "function"
            ? data.createdAt.toDate()
            : data.createdAt
            ? new Date(data.createdAt)
            : new Date(),
        createdBy: data.createdBy,
        lastLoginAt:
          data.lastLoginAt && typeof data.lastLoginAt.toDate === "function"
            ? data.lastLoginAt.toDate()
            : data.lastLoginAt
            ? new Date(data.lastLoginAt)
            : undefined,
      } as AdminUser;
    });
  } catch (error) {
    console.error("❌ listAdminUsers error:", error);
    throw new Error("Could not fetch admin users");
  }
}

export async function createAdminUser(
  payload: CreateAdminUserRequest,
  createdBy: string
): Promise<AdminUser> {
  // Check username uniqueness
  const snap = await adminDb
    .collection(ADMIN_USERS_COLLECTION)
    .where("username", "==", payload.username.toLowerCase())
    .limit(1)
    .get();
  
  if (!snap.empty) {
    throw new Error(`Username "${payload.username}" is already taken`);
  }

  const passwordHash = await hashPassword(payload.password);

  const docRef = await adminDb.collection(ADMIN_USERS_COLLECTION).add({
    username: payload.username.toLowerCase().trim(),
    displayName: payload.displayName.trim(),
    passwordHash,
    role: payload.role,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy,
  });

  return {
    id: docRef.id,
    username: payload.username.toLowerCase().trim(),
    displayName: payload.displayName.trim(),
    passwordHash,
    role: payload.role,
    isActive: true,
    createdAt: new Date(),
    createdBy,
  };
}

export async function updateAdminUser(
  userId: string,
  updates: Partial<Pick<AdminUser, "isActive" | "displayName" | "role">>
): Promise<void> {
  await adminDb.collection(ADMIN_USERS_COLLECTION).doc(userId).update(updates);
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await adminDb.collection(ADMIN_USERS_COLLECTION).doc(userId).delete();
}

// Re-export cookie name for use in API routes
export { SESSION_COOKIE_NAME };

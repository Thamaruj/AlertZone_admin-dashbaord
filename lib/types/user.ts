// lib/types/user.ts
// Shared user type interface matching mobile app data schemas

export type UserStatus = "active" | "suspended";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  province?: string;
  district?: string;
  localGovernmentArea?: string; // Local government authority area (LGA)
  nic?: string;                 // National Identity Card
  role: "citizen" | "admin";
  status: UserStatus;
  isVerified: boolean;
  avatarUrl?: string;
  contributionPoints?: number;
  reportsValidated?: number;
  level?: number;
  badges?: string[];
  notificationSound?: boolean;
  alertRadius?: string;
  fcmToken?: string;
  createdAt: string;            // ISO String timestamp
  updatedAt?: any;              // Firestore Timestamp or date
}

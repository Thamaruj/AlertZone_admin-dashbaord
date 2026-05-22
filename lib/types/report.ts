// lib/types/report.ts
// Shared report type interface matching mobile app data schemas

export type ReportStatus = "PENDING" | "ASSIGNED" | "FIXING" | "RESOLVED" | "REJECTED";

export type ReportCategoryId =
  | "road_traffic"
  | "water_drainage"
  | "waste_environment"
  | "social_safety"
  | "bridge_structural"
  | "other";

export interface ReportLocation {
  address: string;
  latitude: number;
  longitude: number;
  area: string; // District or local area name
  province?: string;
  district?: string;
  localGovernmentArea?: string;
}

export interface StatusHistoryEntry {
  status: ReportStatus;
  changedAt: any;      // Firestore Timestamp or ISO string
  changedBy: string;   // Admin UID or "system"
  note?: string;
}

export interface Report {
  id: string;          // Firestore document ID
  uid: string;         // Author user UID
  authorName: string;  // Denormalized name
  title: string;
  category: string;    // Display category
  categoryId: ReportCategoryId;
  categoryIcon: string;
  categoryColor: string;
  description: string;
  location: ReportLocation;
  imageUrls: string[];
  videoUrl?: string;
  status: ReportStatus;
  assignedTo?: string;
  resolutionNote?: string;
  upvoteCount: number;
  isArchived: boolean;
  createdAt: any;      // Firestore Timestamp or ISO string
  updatedAt?: any;     // Firestore Timestamp or ISO string
  statusHistory: StatusHistoryEntry[];
}

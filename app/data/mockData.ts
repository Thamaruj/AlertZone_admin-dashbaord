// ─── Shared Types ─────────────────────────────────────────────────────────────

export type UserStatus = "Active" | "Suspended" | "Pending";
export type ReputationLevel = "Gold" | "Silver" | "Bronze" | "None";

export type User = {
    id: string;
    name: string;
    email: string;
    points: string;
    reputation: ReputationLevel;
    status: UserStatus;
    avatar: string;
};

export type ReportCategory = "Hazard" | "Lighting" | "Waste" | "Roads" | "Water" | "Safety";
export type ReportStatus = "Reported" | "In Progress" | "Solved" | "Closed";
export type ReportPriority = "Low" | "Medium" | "High" | "Critical";

export type Reporter = {
    name: string;
    phone: string;
    email: string;
    reportsCount: number;
};

export type Note = {
    id: string;
    author: string;
    text: string;
    time: string;
    type: "internal" | "public";
};

export type Report = {
    id: string;
    category: ReportCategory;
    location: string;
    coordinates: { lat: number; lng: number };
    time: string;
    status: ReportStatus;
    priority: ReportPriority;
    description: string;
    images: string[];
    reporter: Reporter;
    notes: Note[];
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

export type MonthlyData = { month: string; y2025: number; y2026: number };
export type BarData = { label: string; value: number; color: string; breakdown: { reported: number; inProgress: number; solved: number; closed: number } };
export type IncidentByCategory = { name: string; reported: number; inProgress: number; solved: number; closed: number; color: string };
export type DailyActivity = { day: string; reports: number; solved: number };
export type RegionalPerformance = { region: string; reports: number; avgResolution: string; satisfaction: number };

export const MOCK_USERS: User[] = [];

export const MOCK_REPORTS: Report[] = [];

export const MONTHLY_DATA: MonthlyData[] = [];

export const BAR_DATA: BarData[] = [];

export const INCIDENT_BY_CATEGORY: IncidentByCategory[] = [];

export const DAILY_ACTIVITY: DailyActivity[] = [];

export const REGIONAL_PERFORMANCE: RegionalPerformance[] = [];

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
    province?: string;
    district?: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

export type MonthlyData = { month: string; y2025: number; y2026: number };
export type BarData = { label: string; value: number; color: string; breakdown: { reported: number; inProgress: number; solved: number; closed: number } };
export type IncidentByCategory = { name: string; reported: number; inProgress: number; solved: number; closed: number; color: string };
export type DailyActivity = { day: string; reports: number; solved: number };
export type RegionalPerformance = { region: string; reports: number; avgResolution: string; satisfaction: number };

export type NotificationType = "System" | "Report" | "User" | "Alert";
export type Notification = {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    time: string;
    isRead: boolean;
};

export const MOCK_USERS: User[] = [];

export const MOCK_REPORTS: Report[] = [
    {
        id: "REP-001",
        category: "Hazard",
        location: "Albert Crescent, Colombo 07",
        coordinates: { lat: 6.9123, lng: 79.8645 },
        time: "2 hours ago",
        status: "Reported",
        priority: "High",
        description: "Large falling tree branch blocking half of the road near the National Museum entrance.",
        images: [],
        reporter: {
            name: "Ranil Perera",
            phone: "+94 77 123 4567",
            email: "ranil@gmail.com",
            reportsCount: 3
        },
        notes: [],
        province: "Western",
        district: "Colombo"
    },
    {
        id: "REP-002",
        category: "Waste",
        location: "Galle Road, Colombo 03 (Kollupitiya)",
        coordinates: { lat: 6.9185, lng: 79.8492 },
        time: "4 hours ago",
        status: "In Progress",
        priority: "Medium",
        description: "Uncollected garbage pile overflowing on the pavement, causing bad odor.",
        images: [],
        reporter: {
            name: "Amara Silva",
            phone: "+94 71 987 6543",
            email: "amara@yahoo.com",
            reportsCount: 1
        },
        notes: [
            { id: "N-001", author: "Admin Alex", text: "Assigned to the municipal waste team.", time: "3 hours ago", type: "internal" }
        ],
        province: "Western",
        district: "Colombo"
    },
    {
        id: "REP-003",
        category: "Roads",
        location: "R. A. De Mel Mawatha, Colombo 04",
        coordinates: { lat: 6.8965, lng: 79.8558 },
        time: "1 day ago",
        status: "Solved",
        priority: "Critical",
        description: "Massive pothole in the middle lane causing sudden braking and safety risk for motorbikes.",
        images: [],
        reporter: {
            name: "Nishantha Fernando",
            phone: "+94 72 456 7890",
            email: "nish@live.com",
            reportsCount: 8
        },
        notes: [],
        province: "Western",
        district: "Colombo"
    },
    {
        id: "REP-004",
        category: "Lighting",
        location: "Baseline Road, Colombo 09 (Dematagoda)",
        coordinates: { lat: 6.9348, lng: 79.8762 },
        time: "2 days ago",
        status: "Reported",
        priority: "Low",
        description: "Three streetlights in a row are flickering and dim, making the walkway dark.",
        images: [],
        reporter: {
            name: "Dilini Cooray",
            phone: "+94 75 321 0987",
            email: "dilini@gmail.com",
            reportsCount: 2
        },
        notes: [],
        province: "Western",
        district: "Colombo"
    },
    {
        id: "REP-005",
        category: "Water",
        location: "Parliament Road, Rajagiriya",
        coordinates: { lat: 6.9082, lng: 79.8974 },
        time: "3 days ago",
        status: "Closed",
        priority: "Medium",
        description: "Burst water pipe leaking fresh water onto the road surface, causing slight flooding.",
        images: [],
        reporter: {
            name: "Kamil De Silva",
            phone: "+94 76 654 3210",
            email: "kamil@outlook.com",
            reportsCount: 4
        },
        notes: [],
        province: "Western",
        district: "Colombo"
    },
    {
        id: "REP-006",
        category: "Roads",
        location: "Peradeniya Road, Kandy",
        coordinates: { lat: 7.2842, lng: 80.6253 },
        time: "1 hour ago",
        status: "Reported",
        priority: "Critical",
        description: "Landslide debris blocking the road near the Peradeniya bridge.",
        images: [],
        reporter: {
            name: "Suresh Kandy",
            phone: "+94 77 987 6541",
            email: "suresh@kandy.lk",
            reportsCount: 1
        },
        notes: [],
        province: "Central",
        district: "Kandy"
    },
    {
        id: "REP-007",
        category: "Safety",
        location: "Lighthouse Street, Galle Fort",
        coordinates: { lat: 6.0267, lng: 80.2170 },
        time: "5 hours ago",
        status: "In Progress",
        priority: "Medium",
        description: "Unstable brick wall posing hazard to pedestrians walking along Lighthouse Street.",
        images: [],
        reporter: {
            name: "Mohamed Galle",
            phone: "+94 71 123 7890",
            email: "galle@galle.lk",
            reportsCount: 2
        },
        notes: [],
        province: "Southern",
        district: "Galle"
    },
    {
        id: "REP-008",
        category: "Lighting",
        location: "Hospital Road, Jaffna",
        coordinates: { lat: 9.6615, lng: 80.0145 },
        time: "1 day ago",
        status: "Solved",
        priority: "High",
        description: "All main streetlights along Hospital Road have been successfully replaced with LEDs.",
        images: [],
        reporter: {
            name: "Siva Jaffna",
            phone: "+94 75 456 1230",
            email: "siva@jaffna.lk",
            reportsCount: 5
        },
        notes: [],
        province: "Northern",
        district: "Jaffna"
    },
    {
        id: "REP-009",
        category: "Waste",
        location: "Nilaveli Road, Trincomalee",
        coordinates: { lat: 8.5874, lng: 81.2152 },
        time: "3 days ago",
        status: "Reported",
        priority: "Low",
        description: "Piles of plastic waste left on the beach near the main access road.",
        images: [],
        reporter: {
            name: "Fathima Trinco",
            phone: "+94 76 789 4561",
            email: "fathima@trinco.lk",
            reportsCount: 3
        },
        notes: [],
        province: "Eastern",
        district: "Trincomalee"
    }
];

export const MONTHLY_DATA: MonthlyData[] = [
    { month: "Jan", y2025: 45, y2026: 80 },
    { month: "Feb", y2025: 52, y2026: 95 },
    { month: "Mar", y2025: 68, y2026: 110 },
    { month: "Apr", y2025: 85, y2026: 135 },
    { month: "May", y2025: 92, y2026: 150 },
    { month: "Jun", y2025: 110, y2026: 185 }
];

export const BAR_DATA: BarData[] = [
    { label: "Colombo 03", value: 45, color: "#14b8a6", breakdown: { reported: 15, inProgress: 10, solved: 15, closed: 5 } },
    { label: "Colombo 07", value: 30, color: "#f59e0b", breakdown: { reported: 5, inProgress: 8, solved: 12, closed: 5 } },
    { label: "Colombo 04", value: 28, color: "#ef4444", breakdown: { reported: 8, inProgress: 5, solved: 10, closed: 5 } },
    { label: "Rajagiriya", value: 35, color: "#3b82f6", breakdown: { reported: 10, inProgress: 7, solved: 13, closed: 5 } },
    { label: "Dematagoda", value: 22, color: "#a855f7", breakdown: { reported: 6, inProgress: 6, solved: 8, closed: 2 } }
];

export const INCIDENT_BY_CATEGORY: IncidentByCategory[] = [
    { name: "Hazard", reported: 25, inProgress: 15, solved: 40, closed: 10, color: "bg-rose-500" },
    { name: "Lighting", reported: 30, inProgress: 20, solved: 65, closed: 15, color: "bg-yellow-500" },
    { name: "Waste", reported: 45, inProgress: 35, solved: 80, closed: 20, color: "bg-green-500" },
    { name: "Roads", reported: 20, inProgress: 25, solved: 50, closed: 12, color: "bg-blue-500" },
    { name: "Water", reported: 15, inProgress: 10, solved: 35, closed: 8, color: "bg-sky-500" },
    { name: "Safety", reported: 10, inProgress: 5, solved: 20, closed: 5, color: "bg-violet-500" }
];

export const DAILY_ACTIVITY: DailyActivity[] = [
    { day: "Mon", reports: 12, solved: 8 },
    { day: "Tue", reports: 18, solved: 14 },
    { day: "Wed", reports: 15, solved: 11 },
    { day: "Thu", reports: 22, solved: 16 },
    { day: "Fri", reports: 25, solved: 20 },
    { day: "Sat", reports: 10, solved: 12 },
    { day: "Sun", reports: 8, solved: 6 }
];

export const REGIONAL_PERFORMANCE: RegionalPerformance[] = [
    { region: "Colombo Municipal Council", reports: 125, avgResolution: "1.8 days", satisfaction: 88 },
    { region: "Kotte Municipal Council", reports: 65, avgResolution: "2.3 days", satisfaction: 82 },
    { region: "Dehiwela-Mount Lavinia", reports: 48, avgResolution: "3.1 days", satisfaction: 75 }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: "NOTIF-001",
        title: "New Critical Report",
        message: "A new critical hazard has been reported in Downtown Area.",
        type: "Report",
        time: "10 mins ago",
        isRead: false,
    },
    {
        id: "NOTIF-002",
        title: "System Update",
        message: "The platform will undergo maintenance at 2 AM EST.",
        type: "System",
        time: "1 hour ago",
        isRead: false,
    },
    {
        id: "NOTIF-003",
        title: "New User Registration",
        message: "5 new citizens registered in the last 24 hours.",
        type: "User",
        time: "3 hours ago",
        isRead: true,
    },
    {
        id: "NOTIF-004",
        title: "High Alert: Road Block",
        message: "Major road block due to flooding on Main St.",
        type: "Alert",
        time: "5 hours ago",
        isRead: true,
    },
    {
        id: "NOTIF-005",
        title: "Report Resolved",
        message: "Report #REP-409 (Waste) was marked as solved by Alex.",
        type: "Report",
        time: "1 day ago",
        isRead: true,
    }
];

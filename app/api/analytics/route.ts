// app/api/analytics/route.ts
// GET /api/analytics?range=7|30|90
// Aggregates report data from Firestore into analytics-ready payloads.

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase-admin";

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) return null;
  return session;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayBucket {
  day: string;       // e.g. "Mon", "26 May"
  date: string;      // ISO date "YYYY-MM-DD"
  reports: number;
  solved: number;
}

interface CategoryStat {
  categoryId: string;
  name: string;
  color: string;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  total: number;
}

interface ProvinceStat {
  province: string;
  total: number;
  resolved: number;
  resolutionRate: number;
}

interface AnalyticsPayload {
  summary: {
    totalReports: number;
    resolvedReports: number;
    resolutionRate: number;
    activeCitizens: number;
    resolvedToday: number;
    pendingReports: number;
    avgResolutionHours: number | null;
  };
  dailyActivity: DayBucket[];
  categoryBreakdown: CategoryStat[];
  provinceDistribution: ProvinceStat[];
}

// ─── Category metadata (matching GUIDELINES.md) ───────────────────────────────

const CATEGORY_META: Record<string, { name: string; color: string }> = {
  road_traffic:      { name: "Road & Traffic",      color: "#4CC2D1" },
  water_drainage:    { name: "Water & Drainage",    color: "#60A5FA" },
  waste_environment: { name: "Waste & Environment", color: "#34D399" },
  social_safety:     { name: "Social Safety",       color: "#A78BFA" },
  bridge_structural: { name: "Bridge & Structural", color: "#F59E0B" },
  other:             { name: "Other",                color: "#94A3B8" },
};

// ─── Province inference ───────────────────────────────────────────────────────

// Sri Lanka province → district mapping for reverse lookup
const DISTRICT_TO_PROVINCE: Record<string, string> = {
  // Western
  colombo: "Western Province", gampaha: "Western Province", kalutara: "Western Province",
  // Central
  kandy: "Central Province", matale: "Central Province", "nuwara eliya": "Central Province",
  // Southern
  galle: "Southern Province", matara: "Southern Province", hambantota: "Southern Province",
  // Northern
  jaffna: "Northern Province", kilinochchi: "Northern Province", mannar: "Northern Province",
  vavuniya: "Northern Province", mullaitivu: "Northern Province",
  // Eastern
  batticaloa: "Eastern Province", ampara: "Eastern Province", trincomalee: "Eastern Province",
  // North Western
  kurunegala: "North Western Province", puttalam: "North Western Province",
  // North Central
  anuradhapura: "North Central Province", polonnaruwa: "North Central Province",
  // Uva
  badulla: "Uva Province", monaragala: "Uva Province",
  // Sabaragamuwa
  ratnapura: "Sabaragamuwa Province", kegalle: "Sabaragamuwa Province",
};

function inferProvince(area: string): string {
  if (!area) return "Unknown";
  const lower = area.toLowerCase();
  for (const [district, province] of Object.entries(DISTRICT_TO_PROVINCE)) {
    if (lower.includes(district)) return province;
  }
  return "Other";
}

// ─── Date utilities ───────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function formatDayLabel(dateStr: string, rangedays: number): string {
  const d = new Date(dateStr + "T00:00:00");
  if (rangedays <= 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" }); // "Mon"
  }
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" }); // "26 May"
}

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rangeParam = req.nextUrl.searchParams.get("range") ?? "30";
  const rangeDays = parseInt(rangeParam, 10) || 30;

  try {
    // Fetch all non-archived reports, ordered by creation date desc
    const snapshot = await adminDb
      .collection("reports")
      .orderBy("createdAt", "desc")
      .get();

    const now = new Date();
    const todayStr = toDateStr(now);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - rangeDays);

    // ── Build date buckets for the selected range ──────────────────────────
    const bucketMap: Map<string, DayBucket> = new Map();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = toDateStr(d);
      bucketMap.set(ds, {
        date: ds,
        day: formatDayLabel(ds, rangeDays),
        reports: 0,
        solved: 0,
      });
    }

    // ── Aggregation accumulators ──────────────────────────────────────────
    let totalReports = 0;
    let resolvedReports = 0;
    let pendingReports = 0;
    let resolvedToday = 0;
    const citizenSet = new Set<string>();
    const resolutionTimes: number[] = [];
    const categoryMap: Map<string, CategoryStat> = new Map();
    const provinceMap: Map<string, ProvinceStat> = new Map();

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Skip archived reports
      if (data.isArchived === true) continue;

      totalReports++;

      // Citizen tracking
      if (data.uid) citizenSet.add(data.uid);

      // Status counts
      const status: string = data.status ?? "PENDING";
      if (status === "PENDING") pendingReports++;
      if (status === "RESOLVED") resolvedReports++;

      // Resolved today check
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : null;
      if (status === "RESOLVED" && updatedAt && toDateStr(updatedAt) === todayStr) {
        resolvedToday++;
      }

      // Avg resolution time — from statusHistory
      const statusHistory: any[] = data.statusHistory ?? [];
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
      if (status === "RESOLVED" && createdAt) {
        // Find last RESOLVED entry in statusHistory
        const resolvedEntry = [...statusHistory]
          .reverse()
          .find((h: any) => h.status === "RESOLVED");
        if (resolvedEntry) {
          const resolvedAt = resolvedEntry.changedAt?.toDate
            ? resolvedEntry.changedAt.toDate()
            : resolvedEntry.changedAt
              ? new Date(resolvedEntry.changedAt)
              : null;
          if (resolvedAt) {
            const hours = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            if (hours >= 0) resolutionTimes.push(hours);
          }
        }
      }

      // Daily activity buckets
      if (createdAt && createdAt >= cutoff) {
        const ds = toDateStr(createdAt);
        const bucket = bucketMap.get(ds);
        if (bucket) bucket.reports++;
      }
      // Bucket resolved reports by their resolved date
      if (status === "RESOLVED") {
        const resolvedEntry = [...statusHistory]
          .reverse()
          .find((h: any) => h.status === "RESOLVED");
        if (resolvedEntry) {
          const resolvedAt = resolvedEntry.changedAt?.toDate
            ? resolvedEntry.changedAt.toDate()
            : resolvedEntry.changedAt
              ? new Date(resolvedEntry.changedAt)
              : null;
          if (resolvedAt && resolvedAt >= cutoff) {
            const ds = toDateStr(resolvedAt);
            const bucket = bucketMap.get(ds);
            if (bucket) bucket.solved++;
          }
        }
      }

      // Category breakdown
      const catId: string = data.categoryId ?? "other";
      const catMeta = CATEGORY_META[catId] ?? CATEGORY_META.other;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          name: catMeta.name,
          color: catMeta.color,
          pending: 0,
          inProgress: 0,
          resolved: 0,
          rejected: 0,
          total: 0,
        });
      }
      const catStat = categoryMap.get(catId)!;
      catStat.total++;
      if (status === "PENDING") catStat.pending++;
      else if (status === "ASSIGNED" || status === "FIXING") catStat.inProgress++;
      else if (status === "RESOLVED") catStat.resolved++;
      else if (status === "REJECTED") catStat.rejected++;

      // Province distribution
      const area: string = data.location?.area ?? data.location?.address ?? "";
      const province = inferProvince(area);
      if (!provinceMap.has(province)) {
        provinceMap.set(province, { province, total: 0, resolved: 0, resolutionRate: 0 });
      }
      const provStat = provinceMap.get(province)!;
      provStat.total++;
      if (status === "RESOLVED") provStat.resolved++;
    }

    // ── Compute resolution rates for provinces ────────────────────────────
    for (const stat of provinceMap.values()) {
      stat.resolutionRate = stat.total > 0
        ? Math.round((stat.resolved / stat.total) * 100)
        : 0;
    }

    // ── Sort provinces by total reports desc ──────────────────────────────
    const provinceDistribution = Array.from(provinceMap.values())
      .filter((p) => p.province !== "Unknown" && p.province !== "Other")
      .sort((a, b) => b.total - a.total);

    // ── Build final payload ───────────────────────────────────────────────
    const avgResolutionHours =
      resolutionTimes.length > 0
        ? Math.round((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) * 10) / 10
        : null;

    const resolutionRate = totalReports > 0
      ? Math.round((resolvedReports / totalReports) * 100)
      : 0;

    const payload: AnalyticsPayload = {
      summary: {
        totalReports,
        resolvedReports,
        resolutionRate,
        activeCitizens: citizenSet.size,
        resolvedToday,
        pendingReports,
        avgResolutionHours,
      },
      dailyActivity: Array.from(bucketMap.values()),
      categoryBreakdown: Array.from(categoryMap.values()).sort((a, b) => b.total - a.total),
      provinceDistribution,
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("❌ GET /api/analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Could not retrieve analytics data" },
      { status: 500 }
    );
  }
}

// app/api/analytics/route.ts
// GET /api/analytics?range=7|30|90 OR ?year=2026 OR ?year=2026&month=5
// Aggregates report data from Firestore — supports range mode, year mode, and year+month mode.

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase-admin";
import { sriLankaGeographics, resolveSrilankaRegion } from "@/lib/constants/sriLankaRegions";

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
  day: string;
  date: string;
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

interface LGAStat {
  name: string;
  total: number;
  resolved: number;
  resolutionRate: number;
}

interface DistrictStat {
  district: string;
  total: number;
  resolved: number;
  resolutionRate: number;
  lgas: LGAStat[];
}

interface ProvinceStat {
  province: string;
  total: number;
  resolved: number;
  resolutionRate: number;
  districts: DistrictStat[];
}

interface AnalyticsPayload {
  filterMode: "range" | "year" | "year_month";
  summary: {
    totalReports: number;
    resolvedReports: number;
    resolutionRate: number;
    activeCitizens: number;
    resolvedToday: number;
    pendingReports: number;
    avgResolutionHours: number | null;
    mostReportedProvince: string | null;
    mostReportedDistrict: string | null;
    mostReportedCategory: string | null;
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

// ─── Date utilities ───────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDayLabel(dateStr: string, mode: "range" | "year" | "year_month", rangeDays?: number): string {
  const d = new Date(dateStr + "T00:00:00");
  if (mode === "year") {
    return d.toLocaleDateString("en-US", { month: "short" }); // "Jan"
  }
  if (mode === "range" && rangeDays && rangeDays <= 7) {
    // Show "Mon 26" for 7-day view
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const day = d.getDate();
    return `${weekday} ${day}`;
  }
  // Default: "26 May"
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Determine filter mode
  const rangeParam = req.nextUrl.searchParams.get("range");
  const yearParam  = req.nextUrl.searchParams.get("year");
  const monthParam = req.nextUrl.searchParams.get("month");

  const now = new Date();
  const todayStr = toDateStr(now);

  let filterMode: "range" | "year" | "year_month" = "range";
  let startDate: Date;
  let endDate: Date = now;
  let rangeDays = 30;

  if (yearParam && monthParam) {
    filterMode = "year_month";
    const y = parseInt(yearParam, 10);
    const m = parseInt(monthParam, 10); // 1-indexed
    startDate = new Date(y, m - 1, 1, 0, 0, 0);
    endDate   = new Date(y, m, 0, 23, 59, 59);
  } else if (yearParam) {
    filterMode = "year";
    const y = parseInt(yearParam, 10);
    startDate = new Date(y, 0, 1, 0, 0, 0);
    endDate   = new Date(y, 11, 31, 23, 59, 59);
  } else {
    filterMode = "range";
    rangeDays = parseInt(rangeParam ?? "30", 10) || 30;
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - rangeDays);
  }

  try {
    const snapshot = await adminDb
      .collection("reports")
      .orderBy("createdAt", "desc")
      .get();

    // ── Build activity buckets ────────────────────────────────────────────
    const bucketMap: Map<string, DayBucket> = new Map();

    if (filterMode === "year") {
      // 12 monthly buckets
      const y = parseInt(yearParam!, 10);
      for (let m = 0; m < 12; m++) {
        const ds = `${y}-${String(m + 1).padStart(2, "0")}-01`;
        const d = new Date(y, m, 1);
        bucketMap.set(`${y}-${String(m + 1).padStart(2, "0")}`, {
          date: ds,
          day: d.toLocaleDateString("en-US", { month: "short" }),
          reports: 0,
          solved: 0,
        });
      }
    } else if (filterMode === "year_month") {
      const y = parseInt(yearParam!, 10);
      const m = parseInt(monthParam!, 10);
      const days = getDaysInMonth(y, m);
      for (let d = 1; d <= days; d++) {
        const ds = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dateObj = new Date(y, m - 1, d);
        bucketMap.set(ds, {
          date: ds,
          day: dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
          reports: 0,
          solved: 0,
        });
      }
    } else {
      // range mode — daily buckets
      for (let i = rangeDays - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const ds = toDateStr(d);
        bucketMap.set(ds, {
          date: ds,
          day: formatDayLabel(ds, "range", rangeDays),
          reports: 0,
          solved: 0,
        });
      }
    }

    // Helper: get bucket key from a date
    function getBucketKey(date: Date): string {
      if (filterMode === "year") {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }
      return toDateStr(date);
    }

    // ── Aggregation ───────────────────────────────────────────────────────
    let totalReports = 0;
    let resolvedReports = 0;
    let pendingReports = 0;
    let resolvedToday = 0;
    const citizenSet = new Set<string>();
    const resolutionTimes: number[] = [];
    const categoryMap: Map<string, CategoryStat> = new Map();

    // Province → District → LGA nested maps
    const provinceMap: Map<string, {
      total: number; resolved: number;
      districts: Map<string, { total: number; resolved: number; lgas: Map<string, { total: number; resolved: number }> }>;
    }> = new Map();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.isArchived === true) continue;

      const createdAt: Date | null = data.createdAt?.toDate ? data.createdAt.toDate() : null;

      // Apply date window filter — skip reports outside the selected period
      if (createdAt && (createdAt < startDate || createdAt > endDate)) continue;

      totalReports++;
      if (data.uid) citizenSet.add(data.uid);

      const status: string = data.status ?? "PENDING";
      if (status === "PENDING") pendingReports++;
      if (status === "RESOLVED") resolvedReports++;

      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : null;
      if (status === "RESOLVED" && updatedAt && toDateStr(updatedAt) === todayStr) {
        resolvedToday++;
      }

      // Avg resolution time
      const statusHistory: any[] = data.statusHistory ?? [];
      if (status === "RESOLVED" && createdAt) {
        const resolvedEntry = [...statusHistory].reverse().find((h: any) => h.status === "RESOLVED");
        if (resolvedEntry) {
          const resolvedAt = resolvedEntry.changedAt?.toDate
            ? resolvedEntry.changedAt.toDate()
            : resolvedEntry.changedAt ? new Date(resolvedEntry.changedAt) : null;
          if (resolvedAt) {
            const hours = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            if (hours >= 0) resolutionTimes.push(hours);
          }
        }
      }

      // Daily activity — bucket submitted reports
      if (createdAt) {
        const key = getBucketKey(createdAt);
        const bucket = bucketMap.get(key);
        if (bucket) bucket.reports++;
      }
      // Bucket resolved reports by their resolved date
      if (status === "RESOLVED") {
        const resolvedEntry = [...statusHistory].reverse().find((h: any) => h.status === "RESOLVED");
        if (resolvedEntry) {
          const resolvedAt = resolvedEntry.changedAt?.toDate
            ? resolvedEntry.changedAt.toDate()
            : resolvedEntry.changedAt ? new Date(resolvedEntry.changedAt) : null;
          if (resolvedAt && resolvedAt >= startDate && resolvedAt <= endDate) {
            const key = getBucketKey(resolvedAt);
            const bucket = bucketMap.get(key);
            if (bucket) bucket.solved++;
          }
        }
      }

      // Category breakdown
      const catId: string = data.categoryId ?? "other";
      const catMeta = CATEGORY_META[catId] ?? CATEGORY_META.other;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { categoryId: catId, name: catMeta.name, color: catMeta.color, pending: 0, inProgress: 0, resolved: 0, rejected: 0, total: 0 });
      }
      const catStat = categoryMap.get(catId)!;
      catStat.total++;
      if (status === "PENDING") catStat.pending++;
      else if (status === "ASSIGNED" || status === "FIXING") catStat.inProgress++;
      else if (status === "RESOLVED") catStat.resolved++;
      else if (status === "REJECTED") catStat.rejected++;

      // Province / District / LGA hierarchy using resolveSrilankaRegion
      const loc = data.location || {};
      const addressObj = {
        region: loc.region || "",
        district: loc.district || "",
        subregion: loc.subregion || "",
        city: loc.city || "",
        name: loc.name || "",
        street: loc.street || ""
      };
      
      const resolved = resolveSrilankaRegion(
        addressObj,
        loc.address || loc.area || "",
        typeof loc.latitude === "number" ? loc.latitude : (loc.latitude ? parseFloat(loc.latitude) : undefined),
        typeof loc.longitude === "number" ? loc.longitude : (loc.longitude ? parseFloat(loc.longitude) : undefined)
      );

      let province = resolved.province;
      if (province && province !== "Unknown Province" && !province.endsWith(" Province")) {
        province = province + " Province";
      }
      const district = resolved.district;
      const lga = resolved.localGovernmentArea;

      if (!provinceMap.has(province)) {
        provinceMap.set(province, { total: 0, resolved: 0, districts: new Map() });
      }
      const prov = provinceMap.get(province)!;
      prov.total++;
      if (status === "RESOLVED") prov.resolved++;

      if (!prov.districts.has(district)) {
        // Pre-populate all official LGAs for this district with 0 counts
        const lgasMap = new Map<string, { total: number; resolved: number }>();
        const cleanProv = province.replace(" Province", "").trim();
        const officialLgas = sriLankaGeographics[cleanProv]?.[district] || [];
        for (const olga of officialLgas) {
          lgasMap.set(olga, { total: 0, resolved: 0 });
        }
        
        prov.districts.set(district, { total: 0, resolved: 0, lgas: lgasMap });
      }
      const dist = prov.districts.get(district)!;
      dist.total++;
      if (status === "RESOLVED") dist.resolved++;

      if (!dist.lgas.has(lga)) {
        dist.lgas.set(lga, { total: 0, resolved: 0 });
      }
      const lgaStat = dist.lgas.get(lga)!;
      lgaStat.total++;
      if (status === "RESOLVED") lgaStat.resolved++;
    }

    // ── Build province distribution with nesting ──────────────────────────
    const provinceDistribution: ProvinceStat[] = Array.from(provinceMap.entries())
      .filter(([p]) => p !== "Unknown" && p !== "Other" && p !== "Unknown Province")
      .map(([province, pData]) => {
        const districts: DistrictStat[] = Array.from(pData.districts.entries())
          .map(([district, dData]) => {
            const lgas: LGAStat[] = Array.from(dData.lgas.entries())
              .map(([name, lData]) => ({
                name,
                total: lData.total,
                resolved: lData.resolved,
                resolutionRate: lData.total > 0 ? Math.round((lData.resolved / lData.total) * 100) : 0,
              }))
              .sort((a, b) => b.total - a.total);
            return {
              district,
              total: dData.total,
              resolved: dData.resolved,
              resolutionRate: dData.total > 0 ? Math.round((dData.resolved / dData.total) * 100) : 0,
              lgas,
            };
          })
          .sort((a, b) => b.total - a.total);
        return {
          province,
          total: pData.total,
          resolved: pData.resolved,
          resolutionRate: pData.total > 0 ? Math.round((pData.resolved / pData.total) * 100) : 0,
          districts,
        };
      })
      .sort((a, b) => b.total - a.total);

    // ── Most reported ─────────────────────────────────────────────────────
    const mostReportedProvince = provinceDistribution[0]?.province ?? null;
    const mostReportedDistrict = provinceDistribution[0]?.districts[0]?.district ?? null;
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
    const mostReportedCategory = sortedCategories[0]?.name ?? null;

    // ── Final payload ─────────────────────────────────────────────────────
    const avgResolutionHours =
      resolutionTimes.length > 0
        ? Math.round((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) * 10) / 10
        : null;

    const payload: AnalyticsPayload = {
      filterMode,
      summary: {
        totalReports,
        resolvedReports,
        resolutionRate: totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0,
        activeCitizens: citizenSet.size,
        resolvedToday,
        pendingReports,
        avgResolutionHours,
        mostReportedProvince,
        mostReportedDistrict,
        mostReportedCategory,
      },
      dailyActivity: Array.from(bucketMap.values()),
      categoryBreakdown: sortedCategories,
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

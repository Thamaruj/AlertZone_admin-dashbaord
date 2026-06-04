// app/api/reports/route.ts
// GET /api/reports — Fetch all non-archived reports (server-side to bypass client rules)

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase-admin";
import { Report } from "@/lib/types/report";
import { resolveSrilankaRegion } from "@/lib/constants/sriLankaRegions";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) return null;
  return session;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireAdmin(req);
  const showArchived = req.nextUrl.searchParams.get("archived") === "true";
  // ?since=<ISO> — used by the dashboard toast poller to only fetch reports newer than a timestamp
  const sinceParam = req.nextUrl.searchParams.get("since");
  const sinceDate = sinceParam ? new Date(sinceParam) : null;
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Single-field order by "createdAt" desc does not require a composite index,
    // and we filter out archived reports in-memory to prevent composite index requirements on Vercel.
    let query = adminDb.collection("reports").orderBy("createdAt", "desc");

    // If polling for new reports since a timestamp, limit to last 20 for performance
    if (sinceDate) {
      query = query.limit(20) as any;
    }

    const snapshot = await (query as any).get();

    let reports = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      
      // Normalize document data: convert all Firestore Timestamp objects to ISO strings
      // to ensure clean JSON serialization and prevent client-side parsing failures.
      const createdAt = data.createdAt?.toDate 
        ? data.createdAt.toDate().toISOString() 
        : data.createdAt;

      const updatedAt = data.updatedAt?.toDate 
        ? data.updatedAt.toDate().toISOString() 
        : data.updatedAt;

      const statusHistory = (data.statusHistory || []).map((history: any) => ({
        ...history,
        changedAt: history.changedAt?.toDate 
          ? history.changedAt.toDate().toISOString() 
          : history.changedAt,
      }));

      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
        statusHistory,
      };
    }) as Report[];

    // In-memory filter for archived or non-archived reports
    reports = reports.filter((r) => (r.isArchived === true) === showArchived);

    // If ?since= was provided, filter to only reports newer than that timestamp
    if (sinceDate) {
      reports = reports.filter((r) => {
        if (!r.createdAt) return false;
        return new Date(r.createdAt as string).getTime() > sinceDate.getTime();
      });
    }

    // Apply admin regional scope filter
    if (session.scope && session.scope !== "all") {
      reports = reports.filter((r) => {
        const loc = (r.location ?? {}) as any;
        const resolved = resolveSrilankaRegion(
          {
            region: loc.province ?? loc.region ?? "",
            district: loc.district ?? "",
            subregion: loc.subregion ?? "",
            city: loc.city ?? "",
            name: loc.name ?? "",
            street: loc.street ?? "",
          },
          loc.address ?? loc.area ?? "",
          typeof loc.latitude === "number" ? loc.latitude : (loc.latitude ? parseFloat(loc.latitude) : undefined),
          typeof loc.longitude === "number" ? loc.longitude : (loc.longitude ? parseFloat(loc.longitude) : undefined)
        );
        if (session.scope === "province") {
          return resolved.province.toLowerCase() === session.province?.toLowerCase();
        }
        if (session.scope === "district") {
          return resolved.district.toLowerCase() === session.district?.toLowerCase();
        }
        if (session.scope === "lga") {
          return resolved.localGovernmentArea?.toLowerCase() === session.lga?.toLowerCase();
        }
        return true;
      });
    }

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("❌ GET /api/reports error:", error);
    return NextResponse.json(
      { error: error.message || "Could not retrieve reports" },
      { status: 500 }
    );
  }
}

// app/api/users/route.ts
// GET /api/users — List citizen users (admin or superadmin)

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { listCitizenUsers } from "@/lib/services/users.service";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) return null;
  return session;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const province = searchParams.get("province") || undefined;
    const district = searchParams.get("district") || undefined;

    // Fetch all users to calculate overall database stats
    const allUsers = await listCitizenUsers({});
    
    const stats = {
      total: allUsers.length,
      active: allUsers.filter((u) => (u.status || "active") === "active").length,
      elite: allUsers.filter((u) => (u.contributionPoints || 0) > 500).length,
    };

    // Filter the dataset in-memory to match query options
    let filteredUsers = [...allUsers];

    if (status && status !== "all") {
      const statusLower = status.toLowerCase();
      filteredUsers = filteredUsers.filter(u => u.status?.toLowerCase() === statusLower);
    }

    if (province && province !== "all") {
      const provLower = province.toLowerCase();
      filteredUsers = filteredUsers.filter(u => u.province?.toLowerCase() === provLower);
    }

    if (district && district !== "all") {
      const distLower = district.toLowerCase();
      filteredUsers = filteredUsers.filter(u => u.district?.toLowerCase() === distLower);
    }

    if (search) {
      const searchLower = search.toLowerCase().trim();
      filteredUsers = filteredUsers.filter(u => 
        (u.fullName || "").toLowerCase().includes(searchLower) ||
        (u.email || "").toLowerCase().includes(searchLower) ||
        (u.phoneNumber || "").toLowerCase().includes(searchLower) ||
        (u.nic || "").toLowerCase().includes(searchLower) ||
        (u.address || "").toLowerCase().includes(searchLower) ||
        (u.localGovernmentArea || "").toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ users: filteredUsers, stats });
  } catch (error) {
    console.error("❌ GET /api/users error:", error);
    return NextResponse.json({ error: "Could not fetch citizen users" }, { status: 500 });
  }
}

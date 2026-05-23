// lib/services/report.service.ts
// Client-side service layer — fetches reports and updates status via Server API routes.

import { Report, ReportStatus } from '@/lib/types/report';

/**
 * Fetches all non-archived reports from the server API
 */
export async function getReports(): Promise<Report[]> {
  const res = await fetch("/api/reports");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch reports");
  }
  const data = await res.json();
  return data.reports || [];
}

/**
 * Updates a report's status via the server API (which handles notifications and history logs)
 */
export async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  adminUid: string,
  note?: string
): Promise<void> {
  const res = await fetch(`/api/reports/${reportId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: newStatus,
      adminId: adminUid,
      note,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update report status");
  }
}

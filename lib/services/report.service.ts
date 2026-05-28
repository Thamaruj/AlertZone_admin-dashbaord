// lib/services/report.service.ts
// Client-side service layer — fetches reports and updates status via Server API routes.

import { Report, ReportStatus } from '@/lib/types/report';

/**
 * Fetches reports from the server API, optionally retrieving archived reports
 */
export async function getReports(archived?: boolean): Promise<Report[]> {
  const url = archived ? "/api/reports?archived=true" : "/api/reports";
  const res = await fetch(url);
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

/**
 * Archives or unarchives a report via the server API
 */
export async function archiveReport(
  reportId: string,
  isArchived: boolean
): Promise<void> {
  const res = await fetch(`/api/reports/${reportId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isArchived,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to archive report");
  }
}

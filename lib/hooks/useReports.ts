// lib/hooks/useReports.ts
// Custom hook to fetch and manage reports from Server API routes.

import { useState, useEffect, useCallback } from 'react';
import { Report, ReportStatus } from '@/lib/types/report';
import { getReports, updateReportStatus, archiveReport as apiArchiveReport } from '@/lib/services/report.service';
import { useAuth } from '@/lib/context/AuthContext';

export function useReports(statusFilter?: ReportStatus | "All", fetchArchived = false) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getReports(fetchArchived);
            setReports(data);
            setError(null);
        } catch (err: any) {
            console.error("❌ Failed to load reports:", err);
            setError(err.message || "Failed to load reports");
        } finally {
            setLoading(false);
        }
    }, [fetchArchived]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const changeStatus = async (reportId: string, newStatus: ReportStatus, note?: string) => {
        if (!user) throw new Error("Must be logged in to update status");
        
        try {
            await updateReportStatus(reportId, newStatus, user.id, note);
            // Refetch reports to sync the client state with the server
            await fetchReports();
        } catch (err: any) {
            console.error("Failed to update status:", err);
            throw err;
        }
    };

    const archiveReport = async (reportId: string, isArchived: boolean) => {
        if (!user) throw new Error("Must be logged in to archive report");

        try {
            await apiArchiveReport(reportId, isArchived);
            await fetchReports();
        } catch (err: any) {
            console.error("Failed to archive report:", err);
            throw err;
        }
    };

    return { reports, loading, error, changeStatus, archiveReport, refresh: fetchReports };
}

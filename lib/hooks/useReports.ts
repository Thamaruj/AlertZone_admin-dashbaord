import { useState, useEffect } from 'react';
import { Report, ReportStatus } from '@/lib/types/report';
import { subscribeToReports, updateReportStatus } from '@/lib/services/report.service';
import { useAuth } from '@/lib/context/AuthContext';

export function useReports(statusFilter?: ReportStatus | "All") {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToReports((data) => {
            setReports(data);
            setLoading(false);
            setError(null);
        }, statusFilter);

        return () => unsubscribe();
    }, [statusFilter]);

    const changeStatus = async (reportId: string, newStatus: ReportStatus, note?: string) => {
        if (!user) throw new Error("Must be logged in to update status");
        
        try {
            await updateReportStatus(reportId, newStatus, user.id, note);
        } catch (err: any) {
            console.error("Failed to update status:", err);
            throw err;
        }
    };

    return { reports, loading, error, changeStatus };
}

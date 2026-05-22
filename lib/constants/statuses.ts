import { ReportStatus } from "@/lib/types/report";

export interface StatusMeta {
    id: ReportStatus;
    label: string;
    color: string;
    bgColor: string;
    icon: string;
}

export const REPORT_STATUSES: Record<ReportStatus, StatusMeta> = {
    PENDING: {
        id: "PENDING",
        label: "Pending",
        color: "#F59E0B",
        bgColor: "#3D2E0A",
        icon: "time-outline",
    },
    ASSIGNED: {
        id: "ASSIGNED",
        label: "Assigned",
        color: "#60A5FA",
        bgColor: "#0D1A3D",
        icon: "person-add-outline",
    },
    FIXING: {
        id: "FIXING",
        label: "Fixing",
        color: "#4CC2D1",
        bgColor: "#0D2A35",
        icon: "construct-outline",
    },
    RESOLVED: {
        id: "RESOLVED",
        label: "Resolved",
        color: "#30A89C",
        bgColor: "#0D3D35",
        icon: "checkmark-circle-outline",
    },
    REJECTED: {
        id: "REJECTED",
        label: "Rejected",
        color: "#E05C5C",
        bgColor: "#3D1515",
        icon: "close-circle-outline",
    }
};

// Helper for UI class mappings (Tailwind)
export const statusStyleMeta: Record<ReportStatus, { color: string; bg: string; dot: string }> = {
    PENDING: { color: "text-[#F59E0B]", bg: "bg-[#3D2E0A]", dot: "bg-[#F59E0B]" },
    ASSIGNED: { color: "text-[#60A5FA]", bg: "bg-[#0D1A3D]", dot: "bg-[#60A5FA]" },
    FIXING: { color: "text-[#4CC2D1]", bg: "bg-[#0D2A35]", dot: "bg-[#4CC2D1]" },
    RESOLVED: { color: "text-[#30A89C]", bg: "bg-[#0D3D35]", dot: "bg-[#30A89C]" },
    REJECTED: { color: "text-[#E05C5C]", bg: "bg-[#3D1515]", dot: "bg-[#E05C5C]" },
};

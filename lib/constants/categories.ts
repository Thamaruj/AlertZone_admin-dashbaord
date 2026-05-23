import { ReportCategoryId } from "@/lib/types/report";

export interface CategoryMeta {
    id: ReportCategoryId;
    label: string;
    icon: string;
    color: string;
    bgColor: string;
}

export const REPORT_CATEGORIES: Record<ReportCategoryId, CategoryMeta> = {
    road_traffic: {
        id: "road_traffic",
        label: "Road & Traffic",
        icon: "car-outline",
        color: "#4CC2D1",
        bgColor: "#0D2A35",
    },
    water_drainage: {
        id: "water_drainage",
        label: "Water & Drainage",
        icon: "water-outline",
        color: "#60A5FA",
        bgColor: "#0D1A3D",
    },
    waste_environment: {
        id: "waste_environment",
        label: "Waste & Env.",
        icon: "trash-outline",
        color: "#34D399",
        bgColor: "#0D3D25",
    },
    social_safety: {
        id: "social_safety",
        label: "Social Safety",
        icon: "shield-outline",
        color: "#A78BFA",
        bgColor: "#2D1F4A",
    },
    bridge_structural: {
        id: "bridge_structural",
        label: "Bridge & Structural",
        icon: "git-network-outline",
        color: "#F59E0B",
        bgColor: "#3D2E0A",
    },
    other: {
        id: "other",
        label: "Other",
        icon: "information-circle-outline",
        color: "#9CA3AF",
        bgColor: "#1F2937",
    }
};

// Helper for UI class mappings (Tailwind)
export const categoryStyleMeta: Record<string, { color: string; bg: string; icon: string }> = {
    "Road & Traffic": { color: "text-[#4CC2D1]", bg: "bg-[#0D2A35]", icon: "🚧" },
    "Water & Drainage": { color: "text-[#60A5FA]", bg: "bg-[#0D1A3D]", icon: "💧" },
    "Waste & Environment": { color: "text-[#34D399]", bg: "bg-[#0D3D25]", icon: "♻️" },
    "Waste & Env.": { color: "text-[#34D399]", bg: "bg-[#0D3D25]", icon: "♻️" },
    "Social Safety": { color: "text-[#A78BFA]", bg: "bg-[#2D1F4A]", icon: "🛡️" },
    "Bridge & Structural": { color: "text-[#F59E0B]", bg: "bg-[#3D2E0A]", icon: "🌉" },
    "Other": { color: "text-[#9CA3AF]", bg: "bg-[#1F2937]", icon: "📍" },
};

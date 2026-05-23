import React from "react";
import { ReportCategoryId } from "@/lib/types/report";

export interface CategoryMeta {
    id: ReportCategoryId;
    label: string;
    icon: string; // Keep for compatibility if needed elsewhere
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

// Modern premium SVG icons with Tailwind styling classes
export const categoryStyleMeta: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    "Road & Traffic": { 
        color: "text-[#4CC2D1]", 
        bg: "bg-[#0D2A35]", 
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ) 
    },
    "Water & Drainage": { 
        color: "text-[#60A5FA]", 
        bg: "bg-[#0D1A3D]", 
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v19M5 12h14M19 13l-7 7-7-7" />
            </svg>
        )
    },
    "Water and Drainage": { 
        color: "text-[#60A5FA]", 
        bg: "bg-[#0D1A3D]", 
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v19M5 12h14M19 13l-7 7-7-7" />
            </svg>
        )
    },
    "Waste & Environment": { 
        color: "text-[#34D399]", 
        bg: "bg-[#0D3D25]", 
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ) 
    },
    "Waste & Env.": { 
        color: "text-[#34D399]", 
        bg: "bg-[#0D3D25]", 
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ) 
    },
    "Social Safety": { 
        color: "text-[#A78BFA]", 
        bg: "bg-[#2D1F4A]", 
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ) 
    },
    "Social Security": { 
        color: "text-[#A78BFA]", 
        bg: "bg-[#2D1F4A]", 
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ) 
    },
    "Bridge & Structural": { 
        color: "text-[#F59E0B]", 
        bg: "bg-[#3D2E0A]", 
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 10v8m10-8v8M5 18h14M3 6h18a2 2 0 012 2v2H1v-2a2 2 0 012-2z" />
            </svg>
        ) 
    },
    "Other": { 
        color: "text-[#9CA3AF]", 
        bg: "bg-[#1F2937]", 
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ) 
    },
};

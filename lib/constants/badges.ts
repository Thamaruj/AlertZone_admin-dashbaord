// lib/constants/badges.ts
// Shared badge definition metadata for the admin dashboard frontend/backend

export type BadgeTier = "bronze" | "silver" | "gold" | "diamond";

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string; // Emoji representing the badge
  tier: BadgeTier;
  tierColor: string; // Tailwind classes for the tier badge
  color: string;     // HEX color of the badge theme
  bgClass: string;   // Tailwind classes for the badge chip background
  description: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── Bronze ──────────────────────────────────────────────────────
  {
    id: "first_report",
    name: "First Responder",
    icon: "🛡️",
    tier: "bronze",
    tierColor: "text-[#CD7F32] border-[#CD7F32]/30 bg-[#CD7F32]/10",
    color: "#FF8C42",
    bgClass: "bg-[#FF8C42]/10 border-[#FF8C42]/20 text-[#FF8C42]",
    description: "Submit your very first incident report",
  },
  {
    id: "early_bird",
    name: "Early Bird",
    icon: "☀️",
    tier: "bronze",
    tierColor: "text-[#CD7F32] border-[#CD7F32]/30 bg-[#CD7F32]/10",
    color: "#F59E0B",
    bgClass: "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]",
    description: "Report an incident before 7:00 AM",
  },
  {
    id: "night_watch",
    name: "Night Watch",
    icon: "🌙",
    tier: "bronze",
    tierColor: "text-[#CD7F32] border-[#CD7F32]/30 bg-[#CD7F32]/10",
    color: "#818CF8",
    bgClass: "bg-[#818CF8]/10 border-[#818CF8]/20 text-[#818CF8]",
    description: "Report an incident after 10:00 PM",
  },
  // ── Silver ──────────────────────────────────────────────────────
  {
    id: "accepted_5",
    name: "Trusted Reporter",
    icon: "🎗️",
    tier: "silver",
    tierColor: "text-[#A8A8A8] border-[#A8A8A8]/30 bg-[#A8A8A8]/10",
    color: "#60A5FA",
    bgClass: "bg-[#60A5FA]/10 border-[#60A5FA]/20 text-[#60A5FA]",
    description: "Have 5 reports accepted by authorities",
  },
  {
    id: "resolved_5",
    name: "Problem Solver",
    icon: "✅",
    tier: "silver",
    tierColor: "text-[#A8A8A8] border-[#A8A8A8]/30 bg-[#A8A8A8]/10",
    color: "#30A89C",
    bgClass: "bg-[#30A89C]/10 border-[#30A89C]/20 text-[#30A89C]",
    description: "Have 5 reports fully resolved",
  },
  {
    id: "points_500",
    name: "Community Champion",
    icon: "👥",
    tier: "silver",
    tierColor: "text-[#A8A8A8] border-[#A8A8A8]/30 bg-[#A8A8A8]/10",
    color: "#A78BFA",
    bgClass: "bg-[#A78BFA]/10 border-[#A78BFA]/20 text-[#A78BFA]",
    description: "Earn 500 contribution points",
  },
  // ── Gold ────────────────────────────────────────────────────────
  {
    id: "accepted_25",
    name: "Veteran Reporter",
    icon: "🌟",
    tier: "gold",
    tierColor: "text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10",
    color: "#F59E0B",
    bgClass: "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]",
    description: "Have 25 reports accepted by authorities",
  },
  {
    id: "resolved_20",
    name: "Resolution Hero",
    icon: "🏆",
    tier: "gold",
    tierColor: "text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10",
    color: "#F97316",
    bgClass: "bg-[#F97316]/10 border-[#F97316]/20 text-[#F97316]",
    description: "Have 20 reports fully resolved",
  },
  {
    id: "points_2000",
    name: "City Guardian",
    icon: "🔰",
    tier: "gold",
    tierColor: "text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10",
    color: "#4CC2D1",
    bgClass: "bg-[#4CC2D1]/10 border-[#4CC2D1]/20 text-[#4CC2D1]",
    description: "Earn 2,000 contribution points",
  },
  // ── Diamond ─────────────────────────────────────────────────────
  {
    id: "accepted_100",
    name: "Legend",
    icon: "🏅",
    tier: "diamond",
    tierColor: "text-[#67E8F9] border-[#67E8F9]/30 bg-[#67E8F9]/10",
    color: "#67E8F9",
    bgClass: "bg-[#67E8F9]/10 border-[#67E8F9]/20 text-[#67E8F9]",
    description: "Have 100 reports accepted by authorities",
  },
  {
    id: "resolved_50",
    name: "Master Resolver",
    icon: "♾️",
    tier: "diamond",
    tierColor: "text-[#67E8F9] border-[#67E8F9]/30 bg-[#67E8F9]/10",
    color: "#818CF8",
    bgClass: "bg-[#818CF8]/10 border-[#818CF8]/20 text-[#818CF8]",
    description: "Have 50 reports fully resolved",
  },
  {
    id: "points_5000",
    name: "AlertZone Elite",
    icon: "💎",
    tier: "diamond",
    tierColor: "text-[#67E8F9] border-[#67E8F9]/30 bg-[#67E8F9]/10",
    color: "#F472B6",
    bgClass: "bg-[#F472B6]/10 border-[#F472B6]/20 text-[#F472B6]",
    description: "Earn 5,000 contribution points",
  },
];

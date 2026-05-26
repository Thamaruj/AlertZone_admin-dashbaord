"use client";

import React, { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = "Last 7 Days" | "Last 30 Days" | "Last 90 Days";
const RANGE_DAYS: Record<TimeRange, number> = { "Last 7 Days": 7, "Last 30 Days": 30, "Last 90 Days": 90 };
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface DayBucket  { day: string; date: string; reports: number; solved: number; }
interface CategoryStat { categoryId: string; name: string; color: string; pending: number; inProgress: number; resolved: number; rejected: number; total: number; }
interface LGAStat    { name: string; total: number; resolved: number; resolutionRate: number; categories: Record<string, number>; }
interface DistrictStat { district: string; total: number; resolved: number; resolutionRate: number; lgas: LGAStat[]; categories: Record<string, number>; }
interface ProvinceStat { province: string; total: number; resolved: number; resolutionRate: number; districts: DistrictStat[]; categories: Record<string, number>; }

interface AnalyticsData {
  filterMode: "range" | "year" | "year_month";
  summary: {
    totalReports: number; resolvedReports: number; resolutionRate: number;
    activeCitizens: number; resolvedToday: number; pendingReports: number;
    avgResolutionHours: number | null;
    mostReportedProvince: string | null; mostReportedProvinceCount: number;
    mostReportedDistrict: string | null; mostReportedDistrictCount: number;
    mostReportedCategory: string | null; mostReportedCategoryCount: number;
  };
  dailyActivity: DayBucket[];
  categoryBreakdown: CategoryStat[];
  provinceDistribution: ProvinceStat[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rateColor(rate: number) {
  if (rate >= 70) return "bg-emerald-500";
  if (rate >= 40) return "bg-[#4CC2D1]";
  return "bg-amber-500";
}

const STATUS_LEGEND = [
  { key: "pending"    as const, label: "Pending",     color: "#F59E0B" },
  { key: "inProgress" as const, label: "In Progress", color: "#4CC2D1" },
  { key: "resolved"   as const, label: "Resolved",    color: "#34D399" },
  { key: "rejected"   as const, label: "Rejected",    color: "#E05C5C" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accent, loading }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accent: string; loading?: boolean;
}) {
  if (loading) return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
      <div className="flex justify-between mb-4"><div className="h-3 w-24 bg-white/10 rounded-full"/><div className="w-10 h-10 rounded-xl bg-white/10"/></div>
      <div className="h-8 w-20 bg-white/10 rounded-lg mb-2"/><div className="h-2.5 w-16 bg-white/5 rounded-full"/>
    </div>
  );
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col gap-1 transition-all duration-300 hover:border-[#4CC2D1]/40 hover:-translate-y-0.5 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px] pointer-events-none"/>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${accent} group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
      </div>
      <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
      {sub && <span className="text-xs font-medium text-slate-500 mt-0.5">{sub}</span>}
    </div>
  );
}

// ─── Highlight Card (Most Reported) ───────────────────────────────────────────

function HighlightCard({ label, value, subText, icon, gradient, loading }: {
  label: string; value: string | null; subText?: string | null; icon: React.ReactNode; gradient: string; loading: boolean;
}) {
  if (loading) return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
      <div className="h-3 w-28 bg-white/10 rounded-full mb-3"/><div className="h-6 w-36 bg-white/10 rounded-lg"/>
    </div>
  );
  return (
    <div className={`${gradient} border rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5`}>
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-base font-bold text-white">{value ?? "—"}</p>
        {subText && <p className="text-[11px] text-slate-400 mt-1">{subText}</p>}
      </div>
    </div>
  );
}

// ─── Daily Activity Chart ─────────────────────────────────────────────────────

function DailyActivityChart({ data, loading }: { data: DayBucket[]; loading: boolean }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (loading) return (
    <div className="w-full h-[320px] animate-pulse flex items-end gap-0.5 px-2 pb-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="flex-1 bg-white/5 rounded-t-sm" style={{ height: `${25 + (i * 7) % 55}%` }}/>
      ))}
    </div>
  );

  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center w-full h-[320px] text-xs text-slate-500">No activity data in this period</div>
  );

  const maxVal = Math.max(...data.map((d) => Math.max(d.reports, d.solved)), 1) * 1.25;
  const W = 800; const H = 280;
  const pad = { top: 30, right: 20, bottom: 36, left: 42 };

  // Adaptive label step
  const step = data.length <= 7 ? 1
             : data.length <= 15 ? 2
             : data.length <= 31 ? 5
             : data.length <= 62 ? 10
             : 15;

  const getX = (i: number) => pad.left + (i * (W - pad.left - pad.right)) / Math.max(data.length - 1, 1);
  const getY = (v: number) => H - pad.bottom - (v * (H - pad.top - pad.bottom)) / maxVal;

  const linePath = (key: "reports" | "solved") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)},${getY(d[key]).toFixed(1)}`).join(" ");
  const areaPath = (key: "reports" | "solved") =>
    `M ${getX(0).toFixed(1)},${H - pad.bottom} ` +
    data.map((d, i) => `L ${getX(i).toFixed(1)},${getY(d[key]).toFixed(1)}`).join(" ") +
    ` L ${getX(data.length - 1).toFixed(1)},${H - pad.bottom} Z`;

  const gridVals = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative w-full h-[320px]" onMouseLeave={() => setHoverIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="gReports" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#F97316" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#34D399" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Y-axis grid */}
        {gridVals.map((p, i) => {
          const y = pad.top + p * (H - pad.top - pad.bottom);
          const val = Math.round(maxVal * (1 - p));
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="white" strokeOpacity="0.04" strokeDasharray="4 4"/>
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#3A6070">{val}</text>
            </g>
          );
        })}

        {/* Area fills */}
        <path d={areaPath("reports")} fill="url(#gReports)"/>
        <path d={areaPath("solved")} fill="url(#gResolved)"/>

        {/* Lines */}
        <path d={linePath("reports")} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={linePath("solved")}  fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

        {/* X-axis labels */}
        {data.map((d, i) => i % step === 0 ? (
          <text key={i} x={getX(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#3A6070">{d.day}</text>
        ) : null)}

        {/* Hover hit areas */}
        {data.map((_, i) => (
          <rect key={i} x={getX(i) - (W / data.length) / 2} y={pad.top}
            width={W / data.length} height={H - pad.top - pad.bottom}
            fill="transparent" className="cursor-crosshair" onMouseEnter={() => setHoverIdx(i)}/>
        ))}

        {/* Hover indicator */}
        {hoverIdx !== null && (
          <g>
            <line x1={getX(hoverIdx)} y1={pad.top} x2={getX(hoverIdx)} y2={H - pad.bottom}
              stroke="#ffffff18" strokeWidth="1" strokeDasharray="4 4"/>
            <circle cx={getX(hoverIdx)} cy={getY(data[hoverIdx].reports)} r="5" fill="#F97316" stroke="#0D1F2D" strokeWidth="2"/>
            <circle cx={getX(hoverIdx)} cy={getY(data[hoverIdx].solved)}  r="5" fill="#34D399" stroke="#0D1F2D" strokeWidth="2"/>
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {hoverIdx !== null && (
        <div className="absolute z-50 bg-[#0F2233] border border-white/10 rounded-xl p-3 shadow-2xl pointer-events-none"
          style={{ left: `${(getX(hoverIdx) / W) * 100}%`, top: "8px", transform: "translateX(-50%)" }}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">{data[hoverIdx].day}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-200">
                <span className="w-2 h-2 rounded-full bg-orange-400"/> Reports
              </span>
              <span className="text-xs font-mono font-bold text-orange-400">{data[hoverIdx].reports}</span>
            </div>
            <div className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400"/> Resolved
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">{data[hoverIdx].solved}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category Breakdown ───────────────────────────────────────────────────────

function CategoryBreakdown({ data, loading }: { data: CategoryStat[]; loading: boolean }) {
  if (loading) return (
    <div className="space-y-5 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          <div className="flex justify-between mb-2"><div className="h-3 w-28 bg-white/10 rounded-full"/><div className="h-3 w-10 bg-white/5 rounded-full"/></div>
          <div className="w-full h-2.5 bg-white/5 rounded-full"/>
        </div>
      ))}
    </div>
  );
  if (!data?.length) return <div className="flex items-center justify-center h-32 text-xs text-slate-500">No category data</div>;

  return (
    <div className="space-y-5">
      {data.map((cat) => {
        const total = cat.total || 1;
        return (
          <div key={cat.categoryId} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: cat.color }}/>
                <span className="text-xs font-bold text-slate-200">{cat.name}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{cat.total}</span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden flex">
              {STATUS_LEGEND.map(({ key, color }) => {
                const pct = (cat[key] / total) * 100;
                if (pct <= 0) return null;
                return (
                  <div key={key} title={`${STATUS_LEGEND.find(s => s.key === key)?.label}: ${cat[key]}`}
                    className="h-full hover:brightness-125 cursor-help transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}/>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LGA Modal ────────────────────────────────────────────────────────────────

function LGAModal({ district, lgas, onClose }: { district: string; lgas: LGAStat[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
      <div className="relative bg-[#0F2233] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white">{district} — Local Gov. Areas</h2>
            <p className="text-xs text-slate-400 mt-0.5">{lgas.length} areas within this district</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2.5 custom-scrollbar">
          {lgas.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No LGA data available</p>
          ) : lgas.map((lga) => (
            <div key={lga.name}
              className="flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl px-4 py-3 transition-all">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{lga.name}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-sm font-mono font-bold text-white">{lga.total}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Resolved</p>
                  <p className="text-sm font-mono font-bold text-emerald-400">{lga.resolved}</p>
                </div>
                <div className="w-20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500">Rate</span>
                    <span className="text-[10px] font-bold text-white">{lga.resolutionRate}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${rateColor(lga.resolutionRate)}`}
                      style={{ width: `${lga.resolutionRate}%` }}/>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Comparison Modal ─────────────────────────────────────────────────────────

function ComparisonModal({
  compareLevel,
  selectedIds,
  candidates,
  onClose,
}: {
  compareLevel: "province" | "district" | "lga";
  selectedIds: string[];
  candidates: {
    id: string;
    name: string;
    subtitle?: string;
    total: number;
    resolved: number;
    resolutionRate: number;
    categories: Record<string, number>;
  }[];
  onClose: () => void;
}) {
  const selectedItems = React.useMemo(() => {
    return candidates.filter((c) => selectedIds.includes(c.id));
  }, [candidates, selectedIds]);

  const REGION_COLORS = [
    { border: "border-[#4CC2D1]/30", text: "text-[#4CC2D1]", bg: "bg-[#4CC2D1]/10", fill: "#4CC2D1" },
    { border: "border-[#A78BFA]/30", text: "text-[#A78BFA]", bg: "bg-[#A78BFA]/10", fill: "#A78BFA" },
    { border: "border-[#F59E0B]/30", text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", fill: "#F59E0B" }
  ];

  const COMPARE_CATEGORIES = [
    { id: "road_traffic", name: "Road & Traffic", color: "#4CC2D1" },
    { id: "water_drainage", name: "Water & Drainage", color: "#60A5FA" },
    { id: "waste_environment", name: "Waste & Environment", color: "#34D399" },
    { id: "social_safety", name: "Social Safety", color: "#A78BFA" },
    { id: "bridge_structural", name: "Bridge & Structural", color: "#F59E0B" },
    { id: "other", name: "Other", color: "#94A3B8" },
  ];

  const maxVal = React.useMemo(() => {
    return Math.max(...selectedItems.map((item) => item.total), 1) * 1.2;
  }, [selectedItems]);

  const hasData = React.useMemo(() => {
    return selectedItems.some((item) => item.total > 0);
  }, [selectedItems]);

  const highestVolume = React.useMemo(() => {
    return [...selectedItems].sort((a, b) => b.total - a.total)[0];
  }, [selectedItems]);

  const highestRate = React.useMemo(() => {
    return [...selectedItems].sort((a, b) => b.resolutionRate - a.resolutionRate)[0];
  }, [selectedItems]);

  const W = 800;
  const H = 260;
  const pad = { top: 30, right: 30, bottom: 40, left: 50 };

  const chartWidth = W - pad.left - pad.right;
  const chartHeight = H - pad.top - pad.bottom;
  const groupWidth = chartWidth / Math.max(selectedItems.length, 1);
  const barWidth = Math.min(32, groupWidth * 0.3);
  const gap = 4;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#0F2233] border border-white/10 rounded-2xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Regional Comparison Playground</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparing {selectedItems.length} selected {compareLevel}s side-by-side
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedItems.map((item, idx) => {
              const theme = REGION_COLORS[idx % REGION_COLORS.length];
              return (
                <div
                  key={item.id}
                  className={`bg-white/[0.02] border ${theme.border} rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group`}
                >
                  <div className={`absolute top-0 right-0 w-16 h-16 ${theme.bg} rounded-bl-[50px] pointer-events-none opacity-20`} />
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      Item {idx + 1}
                    </span>
                    <h4 className={`text-base font-bold text-white truncate ${theme.text} mt-0.5`}>
                      {item.name}
                    </h4>
                    {item.subtitle && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Total Reports</span>
                      <p className="text-xl font-bold text-white font-mono">{item.total}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Resolved</span>
                      <p className="text-xl font-bold text-emerald-400 font-mono">{item.resolved}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-400">Resolution Rate</span>
                      <span className="text-[10px] font-bold text-white">{item.resolutionRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${rateColor(item.resolutionRate)}`}
                        style={{ width: `${item.resolutionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {/* If user selected less than 3, render placeholders to maintain 3-column layout */}
            {selectedItems.length < 3 &&
              Array.from({ length: 3 - selectedItems.length }).map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className="border border-dashed border-white/5 bg-white/[0.01] rounded-2xl p-5 flex flex-col items-center justify-center min-h-[140px] text-slate-600"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-xs">Select more to compare</span>
                </div>
              ))}
          </div>

          {/* Volume Chart & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Chart Card */}
            <div className="lg:col-span-7 bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Volume Comparison</h4>
                <p className="text-[11px] text-slate-400 mb-4">Total reports vs. resolved reports</p>
              </div>
              <div className="w-full">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible">
                  {/* Y-Axis Grid */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                    const y = pad.top + p * chartHeight;
                    const val = Math.round(maxVal * (1 - p));
                    return (
                      <g key={i}>
                        <line
                          x1={pad.left}
                          y1={y}
                          x2={W - pad.right}
                          y2={y}
                          stroke="white"
                          strokeOpacity="0.04"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={pad.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="10"
                          className="fill-slate-400 font-mono"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {selectedItems.map((item, i) => {
                    const groupCenter = pad.left + (i + 0.5) * groupWidth;
                    const x1 = groupCenter - barWidth - gap / 2;
                    const x2 = groupCenter + gap / 2;

                    const h1 = (item.total / maxVal) * chartHeight;
                    const h2 = (item.resolved / maxVal) * chartHeight;

                    const y1 = H - pad.bottom - h1;
                    const y2 = H - pad.bottom - h2;

                    return (
                      <g key={item.id}>
                        {/* Reports Bar (Orange) */}
                        <rect
                          x={x1}
                          y={y1}
                          width={barWidth}
                          height={Math.max(h1, 2)}
                          fill="#F97316"
                          rx="4"
                          className="transition-all duration-500 hover:brightness-110"
                        />
                        <text
                          x={x1 + barWidth / 2}
                          y={y1 - 6}
                          textAnchor="middle"
                          fontSize="10"
                          className="fill-orange-400 font-bold font-mono"
                        >
                          {item.total}
                        </text>

                        {/* Resolved Bar (Green) */}
                        <rect
                          x={x2}
                          y={y2}
                          width={barWidth}
                          height={Math.max(h2, 2)}
                          fill="#34D399"
                          rx="4"
                          className="transition-all duration-500 hover:brightness-110"
                        />
                        <text
                          x={x2 + barWidth / 2}
                          y={y2 - 6}
                          textAnchor="middle"
                          fontSize="10"
                          className="fill-emerald-400 font-bold font-mono"
                        >
                          {item.resolved}
                        </text>

                        {/* X-axis Label */}
                        <text
                          x={groupCenter}
                          y={H - 12}
                          textAnchor="middle"
                          fontSize="11"
                          className="fill-slate-300 font-bold"
                        >
                          {item.name}
                        </text>
                      </g>
                    );
                  })}
                  {/* Baseline */}
                  <line
                    x1={pad.left}
                    y1={H - pad.bottom}
                    x2={W - pad.right}
                    y2={H - pad.bottom}
                    stroke="white"
                    strokeOpacity="0.1"
                  />
                </svg>
              </div>
            </div>

            {/* Insights Card */}
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Comparison Insights</h4>
                {hasData ? (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">Highest Report Volume</p>
                        <p className="text-slate-400 mt-0.5">
                          <span className="text-white font-semibold">{highestVolume.name}</span> has the highest volume
                          with <span className="text-white font-mono font-bold">{highestVolume.total}</span> reports.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">Most Efficient Resolution</p>
                        <p className="text-slate-400 mt-0.5">
                          <span className="text-white font-semibold">{highestRate.name}</span> leads in performance with a
                          resolution rate of <span className="text-emerald-400 font-mono font-bold">{highestRate.resolutionRate}%</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No report metrics available for these regions in the selected period.</p>
                )}
              </div>

              {/* Legend block */}
              <div className="mt-6 pt-4 border-t border-white/5 space-y-2 shrink-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chart Legend</p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    Total Reports
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                    Resolved Reports
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown Matrix */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white">Category Breakdown</h4>
              <p className="text-[11px] text-slate-400">Reports compared by incident category</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COMPARE_CATEGORIES.map((cat) => {
                const maxCatCount = Math.max(...selectedItems.map((item) => item.categories[cat.id] || 0), 1);
                return (
                  <div
                    key={cat.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <h4 className="text-xs font-bold text-white">{cat.name}</h4>
                    </div>
                    <div className="space-y-3">
                      {selectedItems.map((item, idx) => {
                        const theme = REGION_COLORS[idx % REGION_COLORS.length];
                        const count = item.categories[cat.id] || 0;
                        const percent = (count / maxCatCount) * 100;

                        return (
                          <div key={item.id} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.fill }} />
                                {item.name}
                              </span>
                              <span className="font-mono text-slate-400 font-bold">
                                {count} {count === 1 ? "report" : "reports"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-75"
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: theme.fill,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Province Table (expandable) ──────────────────────────────────────────────

function ProvinceTable({
  data, loading, onViewLGA,
}: {
  data: ProvinceStat[];
  loading: boolean;
  onViewLGA: (district: string, lgas: LGAStat[]) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleProvince = (province: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(province) ? next.delete(province) : next.add(province);
      return next;
    });
  };

  if (loading) return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-white/5">
          <td className="px-8 py-5"><div className="h-3 w-36 bg-white/10 rounded-full"/></td>
          <td className="px-8 py-5"><div className="h-3 w-10 bg-white/5 rounded-full"/></td>
          <td className="px-8 py-5"><div className="h-3 w-10 bg-white/5 rounded-full"/></td>
          <td className="px-8 py-5"><div className="h-2 w-24 bg-white/5 rounded-full"/></td>
          <td className="px-8 py-5"/>
        </tr>
      ))}
    </>
  );

  if (!data?.length) return (
    <tr><td colSpan={5} className="px-8 py-10 text-center text-xs text-slate-500">No province data available</td></tr>
  );

  return (
    <>
      {data.map((row) => {
        const isOpen = expanded.has(row.province);
        return (
          <React.Fragment key={row.province}>
            {/* Province row */}
            <tr
              className="hover:bg-white/[0.03] transition-all group cursor-pointer border-b border-white/5"
              onClick={() => toggleProvince(row.province)}>
              <td className="px-8 py-4">
                <div className="flex items-center gap-2.5">
                  <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                  <span className="text-sm font-bold text-white group-hover:text-[#4CC2D1] transition-colors">{row.province}</span>
                  <span className="text-[10px] text-slate-500 font-medium">({row.districts.length} districts)</span>
                </div>
              </td>
              <td className="px-8 py-4"><span className="text-sm font-mono font-bold text-slate-300">{row.total}</span></td>
              <td className="px-8 py-4"><span className="text-sm font-mono font-bold text-emerald-400/80">{row.resolved}</span></td>
              <td className="px-8 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-[60px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${rateColor(row.resolutionRate)} transition-all duration-700`}
                      style={{ width: `${row.resolutionRate}%` }}/>
                  </div>
                  <span className="text-xs font-bold text-white tabular-nums w-9 text-right">{row.resolutionRate}%</span>
                </div>
              </td>
              <td className="px-8 py-4"/>
            </tr>

            {/* District sub-rows */}
            {isOpen && row.districts.map((dist) => (
              <tr key={`${row.province}-${dist.district}`}
                className="bg-white/[0.015] hover:bg-white/[0.04] transition-all border-b border-white/[0.03]">
                <td className="pl-16 pr-8 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3.5 bg-[#4CC2D1]/40 rounded-full"/>
                    <span className="text-xs font-semibold text-slate-300">{dist.district}</span>
                    <span className="text-[10px] text-slate-600">({dist.lgas.length} areas)</span>
                  </div>
                </td>
                <td className="px-8 py-3.5"><span className="text-xs font-mono text-slate-400">{dist.total}</span></td>
                <td className="px-8 py-3.5"><span className="text-xs font-mono text-emerald-500/70">{dist.resolved}</span></td>
                <td className="px-8 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${rateColor(dist.resolutionRate)}`}
                        style={{ width: `${dist.resolutionRate}%` }}/>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">{dist.resolutionRate}%</span>
                  </div>
                </td>
                <td className="px-8 py-3.5 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewLGA(dist.district, dist.lgas); }}
                    className="text-[10px] font-bold text-[#4CC2D1] hover:text-white border border-[#4CC2D1]/30 hover:border-[#4CC2D1]/60 hover:bg-[#4CC2D1]/10 rounded-lg px-2.5 py-1 transition-all">
                    View LGAs
                  </button>
                </td>
              </tr>
            ))}
          </React.Fragment>
        );
      })}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Analytics() {
  // Filter state — mutually exclusive: either range mode or year/month mode
  const [timeRange, setTimeRange]   = useState<TimeRange>("Last 30 Days");
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null); // 1-indexed

  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // LGA modal state — lifted out of ProvinceTable to avoid rendering <div> inside <tbody>
  const [lgaModal, setLgaModal] = useState<{ district: string; lgas: LGAStat[] } | null>(null);

  // Comparative Analytics state
  const [compareLevel, setCompareLevel] = useState<"province" | "district" | "lga">("province");
  const [compareSearch, setCompareSearch] = useState<string>("");
  const [selectedCompareItems, setSelectedCompareItems] = useState<Set<string>>(new Set());
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);

  // Candidates for comparison
  const compareCandidates = React.useMemo(() => {
    if (!data?.provinceDistribution) return [];
    const list: {
      id: string;
      name: string;
      subtitle?: string;
      total: number;
      resolved: number;
      resolutionRate: number;
      categories: Record<string, number>;
    }[] = [];

    data.provinceDistribution.forEach((p) => {
      if (compareLevel === "province") {
        list.push({
          id: p.province,
          name: p.province,
          total: p.total,
          resolved: p.resolved,
          resolutionRate: p.resolutionRate,
          categories: p.categories || {},
        });
      } else {
        p.districts.forEach((d) => {
          if (compareLevel === "district") {
            list.push({
              id: `${p.province} / ${d.district}`,
              name: d.district,
              subtitle: p.province,
              total: d.total,
              resolved: d.resolved,
              resolutionRate: d.resolutionRate,
              categories: d.categories || {},
            });
          } else if (compareLevel === "lga") {
            d.lgas.forEach((l) => {
              list.push({
                id: `${p.province} / ${d.district} / ${l.name}`,
                name: l.name,
                subtitle: `${p.province} ➔ ${d.district}`,
                total: l.total,
                resolved: l.resolved,
                resolutionRate: l.resolutionRate,
                categories: l.categories || {},
              });
            });
          }
        });
      }
    });

    // Sort by total descending
    return list.sort((a, b) => b.total - a.total);
  }, [data, compareLevel]);

  const filteredCandidates = React.useMemo(() => {
    const query = compareSearch.toLowerCase().trim();
    if (!query) return compareCandidates;
    return compareCandidates.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(query))
    );
  }, [compareCandidates, compareSearch]);

  const handleToggleItem = (id: string) => {
    setSelectedCompareItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size < 3) {
          next.add(id);
        }
      }
      return next;
    });
  };

  const handleLevelChange = (level: "province" | "district" | "lga") => {
    setCompareLevel(level);
    setCompareSearch("");
    setSelectedCompareItems(new Set());
  };

  // Build current year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - 2 + i);

  const buildUrl = useCallback(() => {
    if (filterYear && filterMonth) return `/api/analytics?year=${filterYear}&month=${filterMonth}`;
    if (filterYear)               return `/api/analytics?year=${filterYear}`;
    return `/api/analytics?range=${RANGE_DAYS[timeRange]}`;
  }, [timeRange, filterYear, filterMonth]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed — status ${res.status}`);
      }
      setData(await res.json());
    } catch (err: any) {
      console.error("❌ Analytics fetch failed:", err);
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Filter helpers
  const selectRange = (range: TimeRange) => {
    setTimeRange(range);
    setFilterYear(null);
    setFilterMonth(null);
  };
  const selectYear = (y: number | null) => {
    setFilterYear(y);
    setFilterMonth(null);
    if (y) setTimeRange("Last 30 Days"); // visually deactivate range pills
  };

  const s = data?.summary;
  const isRangeMode = !filterYear;

  const timePeriodText = filterYear && filterMonth
    ? `${MONTHS[filterMonth - 1]} ${filterYear}`
    : filterYear
    ? `${filterYear}`
    : timeRange;

  const formatAvgTime = (h: number | null | undefined) => {
    if (h === null || h === undefined) return "—";
    if (h < 1) return `${Math.round(h * 60)} min`;
    if (h < 24) return `${h.toFixed(1)} hrs`;
    return `${(h / 24).toFixed(1)} days`;
  };

  return (
    <>
      <div className="space-y-8 animate-slide-up">

      {/* ── Header + Filters ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Performance Analytics</h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">Live metrics from Firestore — response efficiency &amp; community engagement.</p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Range pills */}
          <div className={`flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 transition-opacity ${!isRangeMode ? "opacity-40 pointer-events-none" : ""}`}>
            {(["Last 7 Days", "Last 30 Days", "Last 90 Days"] as TimeRange[]).map((r) => (
              <button key={r} onClick={() => selectRange(r)} disabled={loading}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${timeRange === r && isRangeMode ? "bg-[#4CC2D1] text-white shadow-lg shadow-[#4CC2D1]/20" : "text-slate-400 hover:text-slate-200"}`}>
                {r}
              </button>
            ))}
          </div>

          <span className="text-slate-600 text-xs font-medium">or filter by</span>

          {/* Year selector */}
          <div className="flex items-center gap-2">
            <select
              value={filterYear ?? ""}
              onChange={(e) => selectYear(e.target.value ? parseInt(e.target.value) : null)}
              className="bg-white/5 border border-white/10 text-sm text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#4CC2D1]/50 transition-all cursor-pointer appearance-none pr-7"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235A7D8A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
              <option value="" className="bg-[#0F2233]">Year</option>
              {yearOptions.map((y) => <option key={y} value={y} className="bg-[#0F2233]">{y}</option>)}
            </select>

            {/* Month selector — only when year is selected */}
            {filterYear && (
              <select
                value={filterMonth ?? ""}
                onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value) : null)}
                className="bg-white/5 border border-white/10 text-sm text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#4CC2D1]/50 transition-all cursor-pointer appearance-none pr-7"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235A7D8A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
                <option value="" className="bg-[#0F2233]">All Months</option>
                {MONTHS.map((m, i) => <option key={i+1} value={i+1} className="bg-[#0F2233]">{m}</option>)}
              </select>
            )}
          </div>

          {/* Active filter badge */}
          {filterYear && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#4CC2D1] bg-[#4CC2D1]/10 border border-[#4CC2D1]/20 rounded-full px-3 py-1">
              {filterYear}{filterMonth ? ` — ${MONTHS[filterMonth - 1]}` : ""}
              <button onClick={() => { setFilterYear(null); setFilterMonth(null); }}
                className="w-4 h-4 rounded-full hover:bg-[#4CC2D1]/20 flex items-center justify-center transition-all">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </span>
          )}

          {/* Manual refresh */}
          <button onClick={fetchAnalytics} disabled={loading}
            className="ml-auto text-xs font-bold text-slate-400 hover:text-slate-200 border border-white/10 hover:border-white/20 rounded-xl px-3.5 py-1.5 transition-all disabled:opacity-50">
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-2xl px-6 py-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-sm text-rose-300">{error}</p>
          </div>
          <button onClick={fetchAnalytics}
            className="text-xs font-bold text-rose-400 border border-rose-500/30 rounded-lg px-3 py-1.5 hover:bg-rose-500/10 transition-all">
            Retry
          </button>
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Total Reports" loading={loading}
          value={loading ? "—" : (s?.totalReports ?? 0).toLocaleString()}
          sub={loading ? undefined : `${s?.pendingReports ?? 0} pending`}
          accent="text-[#4CC2D1]"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
        />
        <StatCard label="Resolution Rate" loading={loading}
          value={loading ? "—" : `${s?.resolutionRate ?? 0}%`}
          sub={loading ? undefined : `${s?.resolvedReports ?? 0} resolved (${s?.resolvedToday ?? 0} today)`}
          accent="text-emerald-400"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <StatCard label="Active Citizens" loading={loading}
          value={loading ? "—" : (s?.activeCitizens ?? 0).toLocaleString()}
          sub={loading ? undefined : "unique reporters"}
          accent="text-[#A78BFA]"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
      </div>

      {/* ── Most Reported Highlights ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HighlightCard loading={loading}
          label="Most Reported Province"
          value={s?.mostReportedProvince ?? null}
          subText={s?.mostReportedProvince ? `${s.mostReportedProvinceCount} events during ${timePeriodText}` : null}
          gradient="bg-gradient-to-br from-[#4CC2D1]/10 to-transparent border-[#4CC2D1]/20"
          icon={<svg className="w-5 h-5 text-[#4CC2D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
        <HighlightCard loading={loading}
          label="Most Reported District"
          value={s?.mostReportedDistrict ?? null}
          subText={s?.mostReportedDistrict ? `${s.mostReportedDistrictCount} events during ${timePeriodText}` : null}
          gradient="bg-gradient-to-br from-[#A78BFA]/10 to-transparent border-[#A78BFA]/20"
          icon={<svg className="w-5 h-5 text-[#A78BFA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>}
        />
        <HighlightCard loading={loading}
          label="Top Incident Category"
          value={s?.mostReportedCategory ?? null}
          subText={s?.mostReportedCategory ? `${s.mostReportedCategoryCount} events during ${timePeriodText}` : null}
          gradient="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20"
          icon={<svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
      </div>

      {/* Helper message */}
      <p className="text-xs  text-[#4CC2D1] bg-[#4CC2D1]/5 border border-[#4CC2D1]/10 rounded-xl px-4 py-3">
        Adjust the year and month above to view the reports in graphs.
      </p>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Activity */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#4CC2D1]/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">
                {filterYear && filterMonth ? `${MONTHS[filterMonth - 1]} ${filterYear} — Daily Activity`
                  : filterYear ? `${filterYear} — Monthly Activity`
                  : `Daily Activity (${timeRange})`}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Reports submitted vs resolved</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-orange-400">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400"/> Reports
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"/> Resolved
              </div>
            </div>
          </div>
          <DailyActivityChart data={data?.dailyActivity ?? []} loading={loading}/>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#4CC2D1]/30 transition-all duration-300">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-white">By Category</h3>
            <p className="text-xs text-slate-400 mt-0.5">Status breakdown per category</p>
          </div>
          <div className="flex flex-wrap gap-2.5 mb-5">
            {STATUS_LEGEND.map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}/>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
          <CategoryBreakdown data={data?.categoryBreakdown ?? []} loading={loading}/>
        </div>
      </div>

      {/* ── Province Distribution Table ─────────────────────────────────── */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-[#4CC2D1]/30 transition-all duration-300">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Province Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Click a province to expand districts — click &ldquo;View LGAs&rdquo; for local area breakdown</p>
          </div>
          {!loading && data && (
            <span className="text-xs font-bold text-slate-500 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              {data.provinceDistribution.length} provinces
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-4">Province / District</th>
                <th className="px-8 py-4">Total</th>
                <th className="px-8 py-4">Resolved</th>
                <th className="px-8 py-4">Resolution Rate</th>
                <th className="px-8 py-4"/>
              </tr>
            </thead>
            <tbody>
              <ProvinceTable
                data={data?.provinceDistribution ?? []}
                loading={loading}
                onViewLGA={(district, lgas) => setLgaModal({ district, lgas })}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Regional & Category Comparison Section ──────────────────────── */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#4CC2D1]/30 transition-all duration-300">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white">Regional & Report Type Comparison</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare total reports, resolution rates, and category distribution side-by-side (select 2 or 3 regions).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel (Left) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                Comparison Level
              </label>
              <div className="flex gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1">
                {(["province", "district", "lga"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleLevelChange(lvl)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide ${
                      compareLevel === lvl
                        ? "bg-[#4CC2D1] text-white shadow-lg shadow-[#4CC2D1]/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {lvl}s
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Select Candidates
              </label>
              {/* Search box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${compareLevel}s...`}
                  value={compareSearch}
                  onChange={(e) => setCompareSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-xs text-slate-200 rounded-xl pl-8 pr-4 py-2 focus:outline-none focus:border-[#4CC2D1]/50 transition-all"
                />
                <svg className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Candidates checkbox list */}
              <div className="max-h-96 overflow-y-auto border border-white/5 bg-white/[0.01] rounded-xl p-2.5 space-y-1.5 custom-scrollbar">
                {filteredCandidates.length === 0 ? (
                  <p className="text-center text-slate-600 text-xs py-6">No matching candidates</p>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const isSelected = selectedCompareItems.has(candidate.id);
                    const isDisabled = !isSelected && selectedCompareItems.size >= 3;
                    return (
                      <label
                        key={candidate.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#4CC2D1]/10 border-[#4CC2D1]/30 text-white"
                            : "bg-white/[0.01] border-transparent text-slate-300 hover:bg-white/[0.03]"
                        } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => handleToggleItem(candidate.id)}
                            className="rounded border-white/10 text-[#4CC2D1] focus:ring-[#4CC2D1]/50 bg-white/5 w-3.5 h-3.5 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{candidate.name}</p>
                            {candidate.subtitle && (
                              <p className="text-[10px] text-slate-500 truncate">{candidate.subtitle}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-slate-400 shrink-0 ml-2">
                          {candidate.total}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Preview & Compare Button Panel (Right) */}
          <div className="lg:col-span-7 flex flex-col justify-between min-h-[380px]">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                Selected Playground
              </span>

              {selectedCompareItems.size === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl p-8 text-center min-h-[290px]">
                  <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <p className="text-xs text-slate-500">No regions selected.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Select 2 or 3 items from the candidates list to compare.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Array.from(selectedCompareItems).map((id, index) => {
                    const item = compareCandidates.find((c) => c.id === id);
                    if (!item) return null;
                    return (
                      <div
                        key={id}
                        className="bg-white/5 border border-white/10 rounded-xl p-3.5 min-h-[160px] relative flex flex-col justify-between group hover:border-[#4CC2D1]/40 transition-all"
                      >
                        <button
                          onClick={() => handleToggleItem(id)}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            {compareLevel} {index + 1}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate mt-0.5 pr-4">
                            {item.name}
                          </h4>
                          {item.subtitle && (
                            <p className="text-[9px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                          )}
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400">
                          <div>Reports: <span className="text-white font-bold">{item.total}</span></div>
                          <div>Rate: <span className="text-emerald-400 font-bold">{item.resolutionRate}%</span></div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Fill empty spots */}
                  {selectedCompareItems.size < 3 &&
                    Array.from({ length: 3 - selectedCompareItems.size }).map((_, i) => (
                      <div
                        key={`preview-placeholder-${i}`}
                        className="border border-dashed border-white/5 bg-white/[0.01] rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] text-slate-600"
                      >
                        <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-[10px]">Select item</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 text-slate-400">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedCompareItems.size >= 2 ? "bg-emerald-400" : "bg-amber-500"
                  }`}
                />
                <span className="text-xs">
                  {selectedCompareItems.size === 0
                    ? "Select 2 or 3 items"
                    : selectedCompareItems.size === 1
                    ? "Select 1 more item"
                    : `${selectedCompareItems.size} of 3 selected`}
                </span>
              </div>
              <div className="flex gap-2.5">
                {selectedCompareItems.size > 0 && (
                  <button
                    onClick={() => setSelectedCompareItems(new Set())}
                    className="text-xs font-bold text-slate-400 hover:text-slate-200 px-3.5 py-2 rounded-xl transition-all"
                  >
                    Clear All
                  </button>
                )}
                <button
                  disabled={selectedCompareItems.size < 2}
                  onClick={() => setShowComparisonModal(true)}
                  className={`text-xs font-bold px-5 py-2 rounded-xl transition-all ${
                    selectedCompareItems.size >= 2
                      ? "bg-[#4CC2D1] text-white hover:bg-[#3db0bf] hover:shadow-lg hover:shadow-[#4CC2D1]/20 cursor-pointer"
                      : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                  }`}
                >
                  Compare Regions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* LGA Modal — rendered at root level of the component to bypass parent CSS transitions/transforms */}
      {lgaModal && (
        <LGAModal
          district={lgaModal.district}
          lgas={lgaModal.lgas}
          onClose={() => setLgaModal(null)}
        />
      )}

      {/* Comparison Modal — rendered at root level of the component */}
      {showComparisonModal && (
        <ComparisonModal
          compareLevel={compareLevel}
          selectedIds={Array.from(selectedCompareItems)}
          candidates={compareCandidates}
          onClose={() => setShowComparisonModal(false)}
        />
      )}
    </>
  );
}

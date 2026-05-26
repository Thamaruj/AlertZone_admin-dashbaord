"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = "Last 7 Days" | "Last 30 Days" | "Last 90 Days";

const RANGE_DAYS: Record<TimeRange, number> = {
  "Last 7 Days": 7,
  "Last 30 Days": 30,
  "Last 90 Days": 90,
};

interface DayBucket {
  day: string;
  date: string;
  reports: number;
  solved: number;
}

interface CategoryStat {
  categoryId: string;
  name: string;
  color: string;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  total: number;
}

interface ProvinceStat {
  province: string;
  total: number;
  resolved: number;
  resolutionRate: number;
}

interface AnalyticsData {
  summary: {
    totalReports: number;
    resolvedReports: number;
    resolutionRate: number;
    activeCitizens: number;
    resolvedToday: number;
    pendingReports: number;
    avgResolutionHours: number | null;
  };
  dailyActivity: DayBucket[];
  categoryBreakdown: CategoryStat[];
  provinceDistribution: ProvinceStat[];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function AnalyticsStatCard({
  label, value, sub, icon, accentClass, loading,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accentClass: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 bg-white/10 rounded-full" />
          <div className="w-10 h-10 rounded-xl bg-white/10" />
        </div>
        <div className="h-8 w-20 bg-white/10 rounded-lg mb-2" />
        <div className="h-2.5 w-16 bg-white/5 rounded-full" />
      </div>
    );
  }
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col gap-1 transition-all duration-300 hover:border-teal-500/40 hover:-translate-y-0.5 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px] pointer-events-none" />
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${accentClass} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
      {sub && <span className="text-xs font-medium text-slate-500 mt-0.5">{sub}</span>}
    </div>
  );
}

// ─── Daily Activity Chart ─────────────────────────────────────────────────────

function DailyActivityChart({ data, loading }: { data: DayBucket[]; loading: boolean }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="w-full h-[320px] animate-pulse flex items-end gap-1 px-4 pb-4">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="flex-1 bg-white/5 rounded-t-sm" style={{ height: `${30 + Math.random() * 60}%` }} />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-[320px] text-xs text-slate-500">
        No activity data available
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.reports, d.solved)), 1) * 1.25;
  const W = 800;
  const H = 280;
  const pad = { top: 30, right: 30, bottom: 36, left: 36 };

  // Only show every Nth label to avoid crowding
  const labelStep = data.length <= 7 ? 1 : data.length <= 14 ? 2 : data.length <= 31 ? 5 : 10;

  const getX = (i: number) => pad.left + (i * (W - pad.left - pad.right)) / Math.max(data.length - 1, 1);
  const getY = (v: number) => H - pad.bottom - (v * (H - pad.top - pad.bottom)) / maxVal;

  const areaPath = (key: "reports" | "solved") =>
    `M ${getX(0)},${H - pad.bottom} ` +
    data.map((d, i) => `L ${getX(i)},${getY(d[key])}`).join(" ") +
    ` L ${getX(data.length - 1)},${H - pad.bottom} Z`;

  const linePath = (key: "reports" | "solved") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)},${getY(d[key])}`).join(" ");

  // Y-axis grid values
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative w-full h-[320px]" onMouseLeave={() => setHoverIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="gradReports_live" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4CC2D1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4CC2D1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradSolved_live" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#30A89C" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#30A89C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((p, i) => {
          const y = pad.top + p * (H - pad.top - pad.bottom);
          const val = Math.round(maxVal * (1 - p));
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="white" strokeOpacity="0.04" strokeDasharray="4 4" />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#3A6070">{val}</text>
            </g>
          );
        })}

        {/* Area fills */}
        <path d={areaPath("reports")} fill="url(#gradReports_live)" />
        <path d={areaPath("solved")} fill="url(#gradSolved_live)" />

        {/* Lines */}
        <path d={linePath("reports")} fill="none" stroke="#4CC2D1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={linePath("solved")} fill="none" stroke="#30A89C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* X-axis labels */}
        {data.map((d, i) =>
          i % labelStep === 0 ? (
            <text key={i} x={getX(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#3A6070">
              {d.day}
            </text>
          ) : null
        )}

        {/* Hover hit areas */}
        {data.map((_, i) => (
          <rect
            key={i}
            x={getX(i) - (W / data.length) / 2}
            y={pad.top}
            width={W / data.length}
            height={H - pad.top - pad.bottom}
            fill="transparent"
            className="cursor-crosshair"
            onMouseEnter={() => setHoverIdx(i)}
          />
        ))}

        {/* Hover indicator */}
        {hoverIdx !== null && (
          <g>
            <line
              x1={getX(hoverIdx)} y1={pad.top}
              x2={getX(hoverIdx)} y2={H - pad.bottom}
              stroke="#ffffff20" strokeWidth="1" strokeDasharray="4 4"
            />
            <circle cx={getX(hoverIdx)} cy={getY(data[hoverIdx].reports)} r="5" fill="#4CC2D1" stroke="#0D1F2D" strokeWidth="2" />
            <circle cx={getX(hoverIdx)} cy={getY(data[hoverIdx].solved)} r="5" fill="#30A89C" stroke="#0D1F2D" strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {hoverIdx !== null && (
        <div
          className="absolute z-50 bg-[#0F2233] border border-white/10 rounded-xl p-3 shadow-2xl pointer-events-none"
          style={{
            left: `${(getX(hoverIdx) / W) * 100}%`,
            top: "10px",
            transform: "translateX(-50%)",
          }}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
            {data[hoverIdx].day}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#4CC2D1]" /> Reports
              </span>
              <span className="text-xs font-mono font-bold text-[#4CC2D1]">{data[hoverIdx].reports}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#30A89C]" /> Resolved
              </span>
              <span className="text-xs font-mono font-bold text-[#30A89C]">{data[hoverIdx].solved}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category Breakdown ───────────────────────────────────────────────────────

const STATUS_LEGEND = [
  { key: "pending",    label: "Pending",     color: "#F59E0B" },
  { key: "inProgress", label: "In Progress", color: "#4CC2D1" },
  { key: "resolved",   label: "Resolved",    color: "#30A89C" },
  { key: "rejected",   label: "Rejected",    color: "#E05C5C" },
] as const;

function CategoryBreakdown({ data, loading }: { data: CategoryStat[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <div className="flex justify-between mb-2">
              <div className="h-3 w-28 bg-white/10 rounded-full" />
              <div className="h-3 w-10 bg-white/5 rounded-full" />
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-32 text-xs text-slate-500">No category data available</div>;
  }

  return (
    <div className="space-y-5">
      {data.map((cat) => {
        const total = cat.total || 1;
        return (
          <div key={cat.categoryId} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs font-bold text-slate-200">{cat.name}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{cat.total} total</span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden flex">
              {STATUS_LEGEND.map(({ key, color }) => {
                const pct = (cat[key] / total) * 100;
                if (pct <= 0) return null;
                return (
                  <div
                    key={key}
                    title={`${STATUS_LEGEND.find(s => s.key === key)?.label}: ${cat[key]}`}
                    className="h-full transition-all duration-700 ease-out hover:brightness-125 cursor-help"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Province Table ───────────────────────────────────────────────────────────

function ProvinceTable({ data, loading }: { data: ProvinceStat[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-8 py-4 border-b border-white/5">
            <div className="h-3 w-36 bg-white/10 rounded-full" />
            <div className="h-3 w-10 bg-white/5 rounded-full ml-auto" />
            <div className="h-3 w-10 bg-white/5 rounded-full" />
            <div className="h-2 w-24 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <tr>
        <td colSpan={4} className="px-8 py-10 text-center text-xs text-slate-500">
          No regional data available
        </td>
      </tr>
    );
  }
  return (
    <>
      {data.map((row) => (
        <tr key={row.province} className="hover:bg-white/[0.03] transition-all group">
          <td className="px-8 py-5">
            <span className="text-sm font-bold text-white group-hover:text-[#4CC2D1] transition-colors">{row.province}</span>
          </td>
          <td className="px-8 py-5">
            <span className="text-sm font-mono font-bold text-slate-300">{row.total}</span>
          </td>
          <td className="px-8 py-5">
            <span className="text-sm font-mono font-bold text-[#30A89C]/80">{row.resolved}</span>
          </td>
          <td className="px-8 py-5">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-[60px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${row.resolutionRate >= 70 ? "bg-[#30A89C]" : row.resolutionRate >= 40 ? "bg-[#4CC2D1]" : "bg-amber-500"}`}
                  style={{ width: `${row.resolutionRate}%` }}
                />
              </div>
              <span className="text-xs font-bold text-white tabular-nums">{row.resolutionRate}%</span>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("Last 30 Days");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (range: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const days = RANGE_DAYS[range];
      const res = await fetch(`/api/analytics?range=${days}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }
      const payload: AnalyticsData = await res.json();
      setData(payload);
    } catch (err: any) {
      console.error("❌ Analytics fetch failed:", err);
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange, fetchAnalytics]);

  const s = data?.summary;

  // Format avg resolution time nicely
  const formatAvgTime = (hours: number | null | undefined): string => {
    if (hours === null || hours === undefined) return "—";
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Performance Analytics</h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            Live metrics from Firestore — municipal response efficiency & community engagement.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {(["Last 7 Days", "Last 30 Days", "Last 90 Days"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              disabled={loading}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
                timeRange === range
                  ? "bg-[#4CC2D1] text-white shadow-lg shadow-[#4CC2D1]/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-2xl px-6 py-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-rose-300">{error}</p>
          </div>
          <button
            onClick={() => fetchAnalytics(timeRange)}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg px-3 py-1.5 transition-all hover:bg-rose-500/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up stagger-1">
        <AnalyticsStatCard
          label="Total Reports"
          value={loading ? "—" : (s?.totalReports ?? 0).toLocaleString()}
          sub={loading ? undefined : `${s?.pendingReports ?? 0} pending`}
          loading={loading}
          accentClass="text-[#4CC2D1]"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <AnalyticsStatCard
          label="Resolution Rate"
          value={loading ? "—" : `${s?.resolutionRate ?? 0}%`}
          sub={loading ? undefined : `${s?.resolvedReports ?? 0} resolved`}
          loading={loading}
          accentClass="text-[#30A89C]"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <AnalyticsStatCard
          label="Active Citizens"
          value={loading ? "—" : (s?.activeCitizens ?? 0).toLocaleString()}
          sub={loading ? undefined : "unique reporters"}
          loading={loading}
          accentClass="text-[#A78BFA]"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <AnalyticsStatCard
          label="Avg. Resolution Time"
          value={loading ? "—" : formatAvgTime(s?.avgResolutionHours)}
          sub={loading ? undefined : s?.resolvedToday !== undefined ? `${s.resolvedToday} resolved today` : undefined}
          loading={loading}
          accentClass="text-emerald-400"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up stagger-2">
        {/* Daily Activity Chart */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#4CC2D1]/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Daily Activity</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Reports submitted vs resolved — {timeRange.toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-[#4CC2D1]">
                <span className="w-2 h-2 rounded-full bg-[#4CC2D1]" /> Reports
              </div>
              <div className="flex items-center gap-1.5 text-[#30A89C]">
                <span className="w-2 h-2 rounded-full bg-[#30A89C]" /> Resolved
              </div>
            </div>
          </div>
          <DailyActivityChart data={data?.dailyActivity ?? []} loading={loading} />
        </div>

        {/* Category Breakdown */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#4CC2D1]/30 transition-all duration-300">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">By Category</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Status breakdown per category</p>
          </div>

          {/* Status legend */}
          <div className="flex flex-wrap gap-3 mb-5">
            {STATUS_LEGEND.map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>

          <CategoryBreakdown data={data?.categoryBreakdown ?? []} loading={loading} />
        </div>
      </div>

      {/* Province Distribution Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden animate-slide-up stagger-3 hover:border-[#4CC2D1]/30 transition-all duration-300">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Province Distribution</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Report volume and resolution rates by province
            </p>
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
                <th className="px-8 py-5">Province</th>
                <th className="px-8 py-5">Total Reports</th>
                <th className="px-8 py-5">Resolved</th>
                <th className="px-8 py-5">Resolution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-5"><div className="h-3 w-36 bg-white/10 rounded-full" /></td>
                    <td className="px-8 py-5"><div className="h-3 w-10 bg-white/5 rounded-full" /></td>
                    <td className="px-8 py-5"><div className="h-3 w-10 bg-white/5 rounded-full" /></td>
                    <td className="px-8 py-5"><div className="h-2 w-24 bg-white/5 rounded-full" /></td>
                  </tr>
                ))
              ) : (
                <ProvinceTable data={data?.provinceDistribution ?? []} loading={loading} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Insight Cards */}
      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up stagger-3">
          {/* Pending backlog */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-20 h-20 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white">Pending Backlog</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              <span className="text-amber-400 font-bold text-lg">{s?.pendingReports ?? 0}</span> reports awaiting action.
              {(s?.pendingReports ?? 0) > 10
                ? " Consider prioritizing assignment to clear the queue."
                : " Backlog is well-managed."}
            </p>
          </div>

          {/* Resolution performance */}
          <div className="bg-gradient-to-br from-[#30A89C]/10 to-[#4CC2D1]/5 backdrop-blur-xl border border-[#30A89C]/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-20 h-20 text-[#30A89C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#30A89C]/20 flex items-center justify-center text-[#30A89C]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white">Resolution Health</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Overall resolution rate of{" "}
              <span className={`font-bold text-lg ${(s?.resolutionRate ?? 0) >= 60 ? "text-[#30A89C]" : "text-amber-400"}`}>
                {s?.resolutionRate ?? 0}%
              </span>{" "}
              across {(s?.totalReports ?? 0).toLocaleString()} reports.
              {(s?.resolutionRate ?? 0) >= 60 ? " System is performing well." : " Focus on resolving outstanding reports."}
            </p>
          </div>

          {/* Community engagement */}
          <div className="bg-gradient-to-br from-[#A78BFA]/10 to-purple-500/5 backdrop-blur-xl border border-[#A78BFA]/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-20 h-20 text-[#A78BFA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white">Community Engagement</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              <span className="text-[#A78BFA] font-bold text-lg">{(s?.activeCitizens ?? 0).toLocaleString()}</span> unique citizens
              have submitted reports.{" "}
              {(s?.activeCitizens ?? 0) > 0
                ? `Avg. ${((s?.totalReports ?? 0) / Math.max(s?.activeCitizens ?? 1, 1)).toFixed(1)} reports per citizen.`
                : "No engagement data yet."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

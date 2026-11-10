import type { ApplicationStage } from "@fredericton-grad-jobs/shared";

// One colour per application stage, used by the tracker and the dashboard.
// `dot` is a Tailwind background class, `pill` the stage badge, and `hex`
// the same colour for charts.
export const STAGE_STYLES: Record<ApplicationStage, { dot: string; pill: string; hex: string }> = {
  SAVED: { dot: "bg-slate-400", pill: "bg-slate-100 text-slate-700", hex: "#94a3b8" },
  APPLIED: { dot: "bg-indigo-500", pill: "bg-indigo-50 text-indigo-700", hex: "#6366f1" },
  OA: { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-800", hex: "#f59e0b" },
  INTERVIEW: { dot: "bg-violet-600", pill: "bg-violet-50 text-violet-700", hex: "#7c3aed" },
  OFFER: { dot: "bg-emerald-600", pill: "bg-emerald-50 text-emerald-700", hex: "#059669" },
  REJECTED: { dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700", hex: "#f43f5e" },
  WITHDRAWN: { dot: "bg-slate-300", pill: "bg-slate-100 text-slate-500", hex: "#cbd5e1" },
};

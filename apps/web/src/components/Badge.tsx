import type { ReactNode } from "react";
import { JOB_TYPE_LABELS, REMOTE_TYPE_LABELS, type JobType, type RemoteType } from "@fredericton-grad-jobs/shared";

const TONES = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-800 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
} as const;

export type BadgeTone = keyof typeof TONES;

// Pill-shaped label for categories and statuses.
export const Badge = ({ tone = "slate", children }: { tone?: BadgeTone; children: ReactNode }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>
    {children}
  </span>
);

// Internships get their own colour so they stand out to students.
export const JobTypeBadge = ({ type }: { type: JobType }) => (
  <Badge tone={type === "INTERNSHIP" ? "emerald" : "indigo"}>{JOB_TYPE_LABELS[type]}</Badge>
);

export const RemoteBadge = ({ remote }: { remote: RemoteType }) => <Badge>{REMOTE_TYPE_LABELS[remote]}</Badge>;

// Skill tag: quieter than a badge, square-ish.
export const Tag = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
    {children}
  </span>
);

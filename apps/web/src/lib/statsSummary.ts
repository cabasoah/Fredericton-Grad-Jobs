import type { Stats } from "@fredericton-grad-jobs/shared";
import { formatRelativeTime } from "./formatRelativeTime";

const count = new Intl.NumberFormat("en-US");

// e.g. "1,234 open jobs · 1,100 from Greenhouse · 120 from Lever · 14 posted
// here · updated 2 hours ago". Sources with no open jobs are left out.
export const statsSummary = (stats: Stats, now: Date = new Date()) => {
  const { MANUAL, GREENHOUSE, LEVER } = stats.openJobsBySource;
  const parts = [`${count.format(stats.openJobs)} open job${stats.openJobs === 1 ? "" : "s"}`];
  if (GREENHOUSE > 0) parts.push(`${count.format(GREENHOUSE)} from Greenhouse`);
  if (LEVER > 0) parts.push(`${count.format(LEVER)} from Lever`);
  if (MANUAL > 0) parts.push(`${count.format(MANUAL)} posted here`);
  if (stats.lastSuccessfulIngestAt) {
    parts.push(`updated ${formatRelativeTime(stats.lastSuccessfulIngestAt, now)}`);
  }
  return parts.join(" · ");
};

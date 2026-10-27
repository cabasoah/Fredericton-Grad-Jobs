import {
  APPLICATION_STAGES,
  FUNNEL_STAGES,
  REACHED_APPLIED_STAGES,
  RESPONSE_STAGES,
  type ApplicationStage,
  type ApplicationStats,
} from "@fredericton-grad-jobs/shared";
import { isoWeekOf, lastIsoWeeks } from "./weeks";

export const STATS_WEEKS = 12;

export type ApplicationForStats = {
  stage: ApplicationStage;
  appliedAt: Date | null;
  // Every stage the application has been in, from its events.
  events: { toStage: ApplicationStage }[];
};

// How far along the funnel a stage implies. REJECTED implies the application
// was sent (agreed: any stage after SAVED counts as reaching APPLIED);
// WITHDRAWN implies nothing on its own.
const FUNNEL_RANK: Partial<Record<ApplicationStage, number>> = {
  SAVED: 0,
  APPLIED: 1,
  OA: 2,
  INTERVIEW: 3,
  OFFER: 4,
  REJECTED: 1,
};

// Pure calculation behind GET /applications/stats.
export const computeApplicationStats = (
  applications: ApplicationForStats[],
  now: Date,
  timeZone: string,
): ApplicationStats => {
  const countsByStage = Object.fromEntries(APPLICATION_STAGES.map((stage) => [stage, 0])) as Record<
    ApplicationStage,
    number
  >;
  const funnelCounts = FUNNEL_STAGES.map(() => 0);
  const weeks = lastIsoWeeks(now, STATS_WEEKS, timeZone);
  const weekCounts = new Map(weeks.map((week) => [week.key, 0]));
  let reachedApplied = 0;
  let responded = 0;

  for (const application of applications) {
    countsByStage[application.stage]++;

    const history = new Set<ApplicationStage>([application.stage, ...application.events.map((e) => e.toStage)]);
    if (REACHED_APPLIED_STAGES.some((stage) => history.has(stage))) reachedApplied++;
    if (RESPONSE_STAGES.some((stage) => history.has(stage))) responded++;

    const furthest = Math.max(0, ...[...history].map((stage) => FUNNEL_RANK[stage] ?? 0));
    for (let rank = 0; rank <= furthest; rank++) funnelCounts[rank] = (funnelCounts[rank] ?? 0) + 1;

    if (application.appliedAt) {
      const { key } = isoWeekOf(application.appliedAt, timeZone);
      const current = weekCounts.get(key);
      if (current !== undefined) weekCounts.set(key, current + 1);
    }
  }

  return {
    countsByStage,
    funnel: FUNNEL_STAGES.map((stage, index) => ({ stage, count: funnelCounts[index] ?? 0 })),
    weekly: weeks.map((week) => ({ week: week.key, weekStart: week.weekStart, count: weekCounts.get(week.key) ?? 0 })),
    reachedApplied,
    responded,
    responseRate: reachedApplied === 0 ? null : responded / reachedApplied,
    timeZone,
  };
};

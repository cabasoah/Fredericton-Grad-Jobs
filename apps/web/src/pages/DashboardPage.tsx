import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import { LuInbox, LuKanban, LuMailCheck, LuPercent, LuSend } from "react-icons/lu";
import { APPLICATION_STAGE_LABELS, APPLICATION_STAGES, type ApplicationStats } from "@fredericton-grad-jobs/shared";
import { useAuth } from "@/auth/AuthContext";
import { useApplicationStats } from "@/lib/queries/applications";
import { STAGE_STYLES } from "@/lib/stageStyles";
import { buttonPrimary, buttonSecondary, card, pageContainer } from "@/lib/styles";

// Chart roles (one series, so one hue; both validated at 3:1+ on white).
const SERIES = "#6366f1";
const SERIES_CURRENT = "#3730a3";
const TEXT_PRIMARY = "#0f172a";
const TEXT_SECONDARY = "#64748b";
const GRID = "#e2e8f0";

const percent = new Intl.NumberFormat("en-CA", { style: "percent", maximumFractionDigits: 0 });
const shortDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${isoDate}T00:00:00Z`));

const StatTile = ({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) => (
  <div className={`${card} p-5`}>
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</span>
    </div>
    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{detail}</p>
  </div>
);

const ChartCard = ({ title, description, children, aside }: { title: string; description: string; children: ReactNode; aside?: ReactNode }) => (
  <section className={`${card} p-6`} aria-label={title}>
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {aside}
    </div>
    {children}
  </section>
);

type Row = { label: string; count: number; detail: string };

const ChartTooltip = ({ active, payload }: TooltipContentProps<TooltipValueType, number | string>) => {
  const row = payload[0]?.payload as Row | undefined;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-card-hover">
      <p className="font-semibold" style={{ color: TEXT_PRIMARY }}>{row.label}</p>
      <p style={{ color: TEXT_SECONDARY }}>{row.detail}</p>
    </div>
  );
};

// The chart's numbers as a table, for screen readers and exact values.
const DataTable = ({ caption, rows, header }: { caption: string; rows: Row[]; header: [string, string] }) => (
  <details className="mt-3 text-sm">
    <summary className="cursor-pointer text-indigo-600">Show as a table</summary>
    <table className="mt-2 w-full text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-slate-200">
          <th scope="col" className="py-1 pr-4 font-medium">{header[0]}</th>
          <th scope="col" className="py-1 font-medium">{header[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-slate-100">
            <th scope="row" className="py-1 pr-4 font-normal">{row.label}</th>
            <td className="py-1">{row.detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </details>
);

// How many applications reached each stage (or a later one), as bars
// relative to the first stage.
const Funnel = ({ stats }: { stats: ApplicationStats }) => {
  const top = stats.funnel[0]?.count ?? 0;
  return (
    <ul className="space-y-5">
      {stats.funnel.map(({ stage, count }) => {
        const share = top ? count / top : 0;
        return (
          <li key={stage}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-slate-800">
                <span aria-hidden className={`h-2 w-2 rounded-full ${STAGE_STYLES[stage].dot}`} />
                {APPLICATION_STAGE_LABELS[stage]}
              </span>
              <span className="text-slate-500">
                {count} · <span className="font-semibold text-slate-900">{percent.format(share)}</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
              <div className={`h-full rounded-full ${STAGE_STYLES[stage].dot}`} style={{ width: `${share * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

// Every application by its current stage, with a stacked bar.
const ByStage = ({ stats, total }: { stats: ApplicationStats; total: number }) => (
  <>
    <ul className="space-y-3">
      {APPLICATION_STAGES.map((stage) => {
        const count = stats.countsByStage[stage];
        return (
          <li key={stage} className="flex items-center gap-3 text-sm">
            <span aria-hidden className={`h-2 w-2 rounded-full ${STAGE_STYLES[stage].dot}`} />
            <span className="flex-1 text-slate-700">{APPLICATION_STAGE_LABELS[stage]}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_STYLES[stage].pill}`}>{count}</span>
            <span className="w-10 text-right text-xs text-slate-500">{percent.format(total ? count / total : 0)}</span>
          </li>
        );
      })}
    </ul>
    <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
      {APPLICATION_STAGES.map((stage) => (
        <div key={stage} className={STAGE_STYLES[stage].dot} style={{ width: `${total ? (stats.countsByStage[stage] / total) * 100 : 0}%` }} />
      ))}
    </div>
  </>
);

const WeeklyChart = ({ stats }: { stats: ApplicationStats }) => {
  const rows: Row[] = stats.weekly.map(({ week, weekStart, count }) => ({
    label: `Week of ${shortDate(weekStart)}`,
    count,
    detail: `${count} application${count === 1 ? "" : "s"} (${week})`,
  }));
  if (rows.every((row) => row.count === 0)) {
    return <p className="py-10 text-center text-sm text-slate-500">No applications sent in the last 12 weeks.</p>;
  }
  return (
    <>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 0 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="label"
              tickFormatter={(label: string) => label.replace("Week of ", "")}
              tick={{ fill: TEXT_SECONDARY, fontSize: 12 }}
              axisLine={{ stroke: GRID }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis allowDecimals={false} width={32} tick={{ fill: TEXT_SECONDARY, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={ChartTooltip} cursor={{ fill: "#eef2ff" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
              {rows.map((row, index) => (
                <Cell key={row.label} fill={index === rows.length - 1 ? SERIES_CURRENT : SERIES} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES_CURRENT }} /> This week</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES }} /> Earlier weeks</span>
      </div>
      <DataTable caption="Applications sent per week" header={["Week", "Applications"]} rows={rows} />
    </>
  );
};

// Rendered inside <RequireRole role="SEEKER">.
const DashboardPage = () => {
  const { user } = useAuth();
  const { data: stats, status, refetch } = useApplicationStats();
  const total = stats ? Object.values(stats.countsByStage).reduce((sum, count) => sum + count, 0) : 0;
  const firstName = user?.name.trim().split(/\s+/)[0];

  return (
    <div className={`${pageContainer} py-10`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {firstName ? `Welcome back, ${firstName}` : "Application dashboard"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">How your applications are moving, and how many get a response.</p>
        </div>
        <Link to="/tracker" className={buttonSecondary}>
          <LuKanban aria-hidden /> Open tracker
        </Link>
      </div>

      {status === "pending" ? (
        <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading your statistics">
          {[0, 1, 2, 3].map((index) => <div key={index} className="h-32 rounded-2xl border border-slate-200 bg-white" />)}
        </div>
      ) : status === "error" ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center" role="alert">
          <p className="mb-4 text-sm text-rose-700">Could not load your statistics.</p>
          <button type="button" onClick={() => void refetch()} className={buttonPrimary}>Retry</button>
        </div>
      ) : total === 0 ? (
        <div className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600">
            <LuInbox aria-hidden />
          </span>
          <p className="font-semibold text-slate-900">No applications to chart yet.</p>
          <p className="mb-6 mt-1 max-w-md text-sm text-slate-500">
            Save jobs or add applications in your tracker, and your funnel and weekly activity will appear here.
          </p>
          <Link to="/jobs" className={buttonPrimary}>Browse jobs</Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Total applications" value={String(total)} detail="Everything on your tracker" icon={<LuInbox aria-hidden />} />
            <StatTile label="Applications sent" value={String(stats.reachedApplied)} detail="Reached Applied or later" icon={<LuSend aria-hidden />} />
            <StatTile
              label="Responses"
              value={String(stats.responded)}
              detail="Assessment, interview, offer or rejection"
              icon={<LuMailCheck aria-hidden />}
            />
            <StatTile
              label="Response rate"
              value={stats.responseRate === null ? "–" : percent.format(stats.responseRate)}
              detail={
                stats.responseRate === null
                  ? "Nothing has reached Applied yet"
                  : `${stats.responded} of ${stats.reachedApplied} applications got a response`
              }
              icon={<LuPercent aria-hidden />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <ChartCard
              title="Funnel"
              description="How many applications reached each stage (or a later one)."
              aside={
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  {stats.reachedApplied} applied
                </span>
              }
            >
              <Funnel stats={stats} />
            </ChartCard>
            <ChartCard
              title="By stage"
              description={`Where your ${total} application${total === 1 ? " is" : "s are"} now.`}
              aside={<Link to="/tracker" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Open board</Link>}
            >
              <ByStage stats={stats} total={total} />
            </ChartCard>
          </div>

          <ChartCard title="Applications per week" description="Last 12 weeks by the date you applied (Monday to Sunday, Atlantic time).">
            <WeeklyChart stats={stats} />
          </ChartCard>

          <p className="text-xs text-slate-500">
            Response rate counts an online assessment, interview, offer or rejection as a response, out of every
            application that reached Applied or a later stage.
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

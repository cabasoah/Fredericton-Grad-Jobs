import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import { APPLICATION_STAGE_LABELS, type ApplicationStats } from "@fredericton-grad-jobs/shared";
import { useApplicationStats } from "@/lib/queries/applications";

// Chart roles (one series per chart, so one hue; validated: 3:1+ on white).
const SERIES = "#2a78d6";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const GRID = "#e5e7eb";

const percent = new Intl.NumberFormat("en-CA", { style: "percent", maximumFractionDigits: 0 });
const shortDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${isoDate}T00:00:00Z`));

const StatTile = ({ label, value, detail }: { label: string; value: string; detail?: string }) => (
  <div className="bg-white rounded-xl shadow-sm p-5">
    <p className="text-sm font-semibold text-gray-600">{label}</p>
    <p className="text-4xl font-bold text-gray-900 mt-1">{value}</p>
    {detail && <p className="text-sm text-gray-600 mt-1">{detail}</p>}
  </div>
);

const ChartCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <section className="bg-white rounded-xl shadow-sm p-5" aria-label={title}>
    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    <p className="text-sm text-gray-600 mb-4">{description}</p>
    {children}
  </section>
);

type Row = { label: string; count: number; detail: string };

const ChartTooltip = ({ active, payload }: TooltipContentProps<TooltipValueType, number | string>) => {
  const row = payload[0]?.payload as Row | undefined;
  if (!active || !row) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-md px-3 py-2 text-sm">
      <p className="font-semibold" style={{ color: TEXT_PRIMARY }}>{row.label}</p>
      <p style={{ color: TEXT_SECONDARY }}>{row.detail}</p>
    </div>
  );
};

// The chart's numbers as a table, for screen readers and exact values.
const DataTable = ({ caption, rows, header }: { caption: string; rows: Row[]; header: [string, string] }) => (
  <details className="mt-3 text-sm">
    <summary className="cursor-pointer text-indigo-700">Show as a table</summary>
    <table className="mt-2 w-full text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b">
          <th scope="col" className="py-1 pr-4">{header[0]}</th>
          <th scope="col" className="py-1">{header[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-gray-100">
            <th scope="row" className="py-1 pr-4 font-normal">{row.label}</th>
            <td className="py-1">{row.detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </details>
);

const FunnelChart = ({ stats }: { stats: ApplicationStats }) => {
  const top = stats.funnel[0]?.count ?? 0;
  const rows: Row[] = stats.funnel.map(({ stage, count }) => ({
    label: APPLICATION_STAGE_LABELS[stage],
    count,
    detail: `${count} (${top ? percent.format(count / top) : "0%"} of all applications)`,
  }));
  return (
    <>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 96, bottom: 4, left: 8 }} barCategoryGap={10}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: TEXT_SECONDARY, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={128} tick={{ fill: TEXT_PRIMARY, fontSize: 13 }} axisLine={false} tickLine={false} />
            <Tooltip content={ChartTooltip} cursor={{ fill: "#eef2ff" }} />
            <Bar dataKey="count" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={28} isAnimationActive={false}>
              <LabelList
                dataKey="count"
                position="right"
                fill={TEXT_SECONDARY}
                fontSize={12}
                formatter={(value) => `${String(value)} (${top ? percent.format(Number(value) / top) : "0%"})`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption="Applications that reached each stage" header={["Stage", "Reached"]} rows={rows} />
    </>
  );
};

const WeeklyChart = ({ stats }: { stats: ApplicationStats }) => {
  const rows: Row[] = stats.weekly.map(({ week, weekStart, count }) => ({
    label: `Week of ${shortDate(weekStart)}`,
    count,
    detail: `${count} application${count === 1 ? "" : "s"} (${week})`,
  }));
  if (rows.every((row) => row.count === 0)) {
    return <p className="text-gray-600 py-10 text-center">No applications sent in the last 12 weeks.</p>;
  }
  return (
    <>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 0 }} barCategoryGap="25%">
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
            <Bar dataKey="count" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption="Applications sent per week" header={["Week", "Applications"]} rows={rows} />
    </>
  );
};

// Rendered inside <RequireRole role="SEEKER">.
const DashboardPage = () => {
  const { data: stats, status, refetch } = useApplicationStats();
  const total = stats ? Object.values(stats.countsByStage).reduce((sum, count) => sum + count, 0) : 0;

  return (
    <section className="bg-indigo-50 min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold text-indigo-700">Application Dashboard</h1>
          <Link to="/tracker" className="bg-white border border-indigo-300 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-100">
            Back to tracker
          </Link>
        </div>

        {status === "pending" ? (
          <div className="grid gap-4 md:grid-cols-4 animate-pulse" role="status" aria-label="Loading your statistics">
            {[0, 1, 2, 3].map((index) => <div key={index} className="h-28 bg-white rounded-xl" />)}
          </div>
        ) : status === "error" ? (
          <div className="text-center" role="alert">
            <p className="text-red-600 mb-4">Could not load your statistics.</p>
            <button type="button" onClick={() => void refetch()} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg">Retry</button>
          </div>
        ) : total === 0 ? (
          <div className="text-center bg-white rounded-xl shadow-sm p-10">
            <p className="text-lg text-gray-700 mb-2">No applications to chart yet.</p>
            <p className="text-gray-600">
              Save jobs or add applications in your <Link to="/tracker" className="text-indigo-700 underline">tracker</Link>, and
              your funnel and weekly activity will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Response rate"
                value={stats.responseRate === null ? "–" : percent.format(stats.responseRate)}
                detail={
                  stats.responseRate === null
                    ? "Nothing has reached Applied yet"
                    : `${stats.responded} of ${stats.reachedApplied} applications got a response`
                }
              />
              <StatTile label="Applications sent" value={String(stats.reachedApplied)} detail="Reached Applied or later" />
              <StatTile label="In progress" value={String(stats.countsByStage.OA + stats.countsByStage.INTERVIEW)} detail="Online assessment or interview" />
              <StatTile label="Offers" value={String(stats.countsByStage.OFFER)} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Funnel" description="How many applications reached each stage (or a later one).">
                <FunnelChart stats={stats} />
              </ChartCard>
              <ChartCard title="Applications per week" description="Last 12 weeks by the date you applied (Monday to Sunday, Atlantic time).">
                <WeeklyChart stats={stats} />
              </ChartCard>
            </div>

            <p className="text-sm text-gray-600">
              Response rate counts an online assessment, interview, offer or rejection as a response, out of every
              application that reached Applied or a later stage.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardPage;

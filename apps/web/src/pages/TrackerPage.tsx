import { useCallback, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LuChartBar, LuDownload, LuInbox, LuLightbulb, LuMessageSquare, LuPlus, LuTrophy } from "react-icons/lu";
import { APPLICATION_STAGES } from "@fredericton-grad-jobs/shared";
import AddApplicationForm from "@/components/tracker/AddApplicationForm";
import ApplicationPanel from "@/components/tracker/ApplicationPanel";
import KanbanBoard from "@/components/tracker/KanbanBoard";
import { applicationsToCsv, downloadCsv } from "@/lib/applicationsCsv";
import { useApplications, useUpdateApplication } from "@/lib/queries/applications";
import { buttonPrimary, buttonSecondary, card } from "@/lib/styles";

const ColumnSkeletons = () => (
  <div className="flex gap-4 overflow-hidden" role="status" aria-label="Loading your applications">
    {APPLICATION_STAGES.map((stage) => (
      <div key={stage} className="w-72 shrink-0 animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-4 h-4 w-24 rounded bg-slate-200" />
        <div className="mb-2 h-20 rounded-xl bg-white" />
        <div className="h-20 rounded-xl bg-white" />
      </div>
    ))}
  </div>
);

const StatTile = ({ label, value, icon }: { label: string; value: number; icon: ReactNode }) => (
  <div className={`${card} flex items-center justify-between p-5`}>
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
    <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-lg text-indigo-600">
      {icon}
    </span>
  </div>
);

// Rendered inside <RequireRole role="SEEKER">.
const TrackerPage = () => {
  const { data: applications, status, refetch } = useApplications();
  const updateApplication = useUpdateApplication();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const closePanel = useCallback(() => setOpenId(null), []);

  const exportCsv = () => {
    if (!applications) return;
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(applicationsToCsv(applications), `applications-${today}.csv`);
  };

  const countIn = (...stages: string[]) => applications?.filter((application) => stages.includes(application.stage)).length ?? 0;

  return (
    <div className="mx-auto w-full max-w-[100rem] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            My applications
            {applications && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                {applications.length} tracked
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Drag cards between stages, and open one for notes, dates and its history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAdding(true)} className={buttonPrimary}>
            <LuPlus aria-hidden /> Add external application
          </button>
          <button type="button" onClick={exportCsv} disabled={!applications?.length} className={buttonSecondary}>
            <LuDownload aria-hidden /> Export CSV
          </button>
          <Link to="/dashboard" className={buttonSecondary}>
            <LuChartBar aria-hidden /> Dashboard
          </Link>
        </div>
      </div>

      {applications && applications.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Total tracked" value={applications.length} icon={<LuInbox />} />
          <StatTile label="Assessments & interviews" value={countIn("OA", "INTERVIEW")} icon={<LuMessageSquare />} />
          <StatTile label="Offers" value={countIn("OFFER")} icon={<LuTrophy />} />
        </div>
      )}

      {adding && <AddApplicationForm onDone={() => setAdding(false)} />}

      {status === "pending" ? (
        <ColumnSkeletons />
      ) : status === "error" ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center" role="alert">
          <p className="mb-4 text-sm text-rose-700">Could not load your applications.</p>
          <button type="button" onClick={() => void refetch()} className={buttonPrimary}>
            Retry
          </button>
        </div>
      ) : applications.length === 0 && !adding ? (
        <div className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600">
            <LuInbox aria-hidden />
          </span>
          <p className="font-semibold text-slate-900">Your tracker is empty.</p>
          <p className="mb-6 mt-1 max-w-md text-sm text-slate-500">
            Save jobs from the <Link to="/jobs" className="font-medium text-indigo-600 hover:text-indigo-700">jobs page</Link>, or add an
            application you sent somewhere else.
          </p>
          <button type="button" onClick={() => setAdding(true)} className={buttonPrimary}>
            <LuPlus aria-hidden /> Add external application
          </button>
        </div>
      ) : (
        <KanbanBoard
          applications={applications}
          onMove={(application, stage) => updateApplication.mutate({ id: application.id, input: { stage } })}
          onOpen={(application) => setOpenId(application.id)}
        />
      )}

      {applications && applications.length > 0 && !adding && (
        <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 sm:flex-row sm:items-center">
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg text-indigo-600">
            <LuLightbulb />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Applying outside this job board?</p>
            <p className="text-sm text-slate-600">Add jobs from other sites or referrals so your whole search lives in one place.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/jobs" className={buttonSecondary}>Browse jobs</Link>
            <button type="button" onClick={() => setAdding(true)} className={buttonPrimary}>
              <LuPlus aria-hidden /> Add application
            </button>
          </div>
        </div>
      )}

      {openId && <ApplicationPanel applicationId={openId} onClose={closePanel} />}
    </div>
  );
};

export default TrackerPage;

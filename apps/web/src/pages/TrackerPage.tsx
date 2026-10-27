import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { FaChartBar, FaDownload, FaPlus } from "react-icons/fa";
import { APPLICATION_STAGES } from "@fredericton-grad-jobs/shared";
import AddApplicationForm from "@/components/tracker/AddApplicationForm";
import ApplicationPanel from "@/components/tracker/ApplicationPanel";
import KanbanBoard from "@/components/tracker/KanbanBoard";
import { applicationsToCsv, downloadCsv } from "@/lib/applicationsCsv";
import { useApplications, useUpdateApplication } from "@/lib/queries/applications";

const ColumnSkeletons = () => (
  <div className="flex gap-4 overflow-hidden" role="status" aria-label="Loading your applications">
    {APPLICATION_STAGES.map((stage) => (
      <div key={stage} className="w-64 shrink-0 rounded-xl bg-gray-100 p-3 animate-pulse">
        <div className="h-5 w-24 bg-gray-300 rounded mb-4" />
        <div className="h-20 bg-white rounded-lg mb-2" />
        <div className="h-20 bg-white rounded-lg" />
      </div>
    ))}
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

  return (
    <section className="bg-indigo-50 min-h-screen px-4 py-8">
      <div className="max-w-[100rem] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold text-indigo-700">My Applications</h1>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg">
              <FaPlus aria-hidden /> Add external application
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!applications?.length}
              className="inline-flex items-center gap-2 bg-white border border-indigo-300 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
            >
              <FaDownload aria-hidden /> Export CSV
            </button>
            <Link to="/dashboard" className="inline-flex items-center gap-2 bg-white border border-indigo-300 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-100">
              <FaChartBar aria-hidden /> Dashboard
            </Link>
          </div>
        </div>

        {adding && <AddApplicationForm onDone={() => setAdding(false)} />}

        {status === "pending" ? (
          <ColumnSkeletons />
        ) : status === "error" ? (
          <div className="text-center" role="alert">
            <p className="text-red-600 mb-4">Could not load your applications.</p>
            <button type="button" onClick={() => void refetch()} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg">
              Retry
            </button>
          </div>
        ) : applications.length === 0 && !adding ? (
          <div className="text-center bg-white rounded-xl shadow-sm p-10">
            <p className="text-lg text-gray-700 mb-2">Your tracker is empty.</p>
            <p className="text-gray-600 mb-6">
              Save jobs from the <Link to="/jobs" className="text-indigo-700 underline">jobs page</Link>, or add an
              application you sent somewhere else.
            </p>
            <button type="button" onClick={() => setAdding(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg">
              Add external application
            </button>
          </div>
        ) : (
          <KanbanBoard
            applications={applications}
            onMove={(application, stage) => updateApplication.mutate({ id: application.id, input: { stage } })}
            onOpen={(application) => setOpenId(application.id)}
          />
        )}
      </div>

      {openId && <ApplicationPanel applicationId={openId} onClose={closePanel} />}
    </section>
  );
};

export default TrackerPage;

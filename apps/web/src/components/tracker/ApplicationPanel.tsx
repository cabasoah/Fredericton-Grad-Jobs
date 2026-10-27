import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import {
  APPLICATION_STAGE_LABELS,
  APPLICATION_STAGES,
  ApplicationStageSchema,
  type ApplicationWithEvents,
} from "@fredericton-grad-jobs/shared";
import { formatDateTime, fromDateInputValue, toDateInputValue } from "@/lib/dates";
import { useApplication, useDeleteApplication, useUpdateApplication } from "@/lib/queries/applications";

type ApplicationPanelProps = {
  applicationId: string;
  onClose: () => void;
};

const inputClass = "border rounded w-full py-2 px-3";
const labelClass = "block text-gray-700 text-sm font-bold mb-1";

// Editable details; keyed by id + updatedAt so it resets when the saved
// application changes.
const DetailsForm = ({ application }: { application: ApplicationWithEvents }) => {
  const updateApplication = useUpdateApplication();
  const [notes, setNotes] = useState(application.notes);
  const [url, setUrl] = useState(application.url ?? "");
  const [appliedAt, setAppliedAt] = useState(toDateInputValue(application.appliedAt));
  const [nextFollowUpAt, setNextFollowUpAt] = useState(toDateInputValue(application.nextFollowUpAt));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateApplication.mutate({
      id: application.id,
      input: {
        notes,
        url: url.trim() === "" ? null : url.trim(),
        appliedAt: fromDateInputValue(appliedAt),
        nextFollowUpAt: fromDateInputValue(nextFollowUpAt),
      },
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="panel-applied" className={labelClass}>Applied on</label>
          <input id="panel-applied" type="date" className={inputClass} value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} />
        </div>
        <div>
          <label htmlFor="panel-follow-up" className={labelClass}>Next follow-up</label>
          <input id="panel-follow-up" type="date" className={inputClass} value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor="panel-url" className={labelClass}>Posting URL</label>
        <input id="panel-url" type="url" className={inputClass} placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div>
        <label htmlFor="panel-notes" className={labelClass}>Notes</label>
        <textarea id="panel-notes" rows={6} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <button
        type="submit"
        disabled={updateApplication.isPending}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
      >
        {updateApplication.isPending ? "Saving..." : "Save details"}
      </button>
    </form>
  );
};

// Side panel for one application: stage, details, links and the history
// of stage changes. A modal dialog: Escape or the backdrop closes it, and
// focus returns to whatever opened it.
const ApplicationPanel = ({ applicationId, onClose }: ApplicationPanelProps) => {
  const { data: application, status } = useApplication(applicationId);
  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      // A stage change moves the card to another column, which replaces its
      // DOM node, so fall back to the card's new button.
      const target = opener?.isConnected
        ? opener
        : document.querySelector<HTMLElement>(`[data-application-id="${applicationId}"]`);
      target?.focus();
    };
  }, [applicationId, onClose]);

  const onDelete = () => {
    if (!application || !window.confirm(`Remove "${application.roleTitle}" from your tracker? Its history is deleted too.`)) return;
    deleteApplication.mutate(application, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className="relative h-full w-full max-w-md bg-white shadow-xl overflow-y-auto p-6"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="panel-title" className="text-2xl font-bold">
              {application?.roleTitle ?? "Application"}
            </h2>
            {application && <p className="text-gray-600">{application.companyName}</p>}
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="rounded p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close details"
          >
            <FaTimes aria-hidden />
          </button>
        </div>

        {status === "pending" && <p className="text-gray-600 animate-pulse" role="status">Loading...</p>}
        {status === "error" && <p className="text-red-600" role="alert">Could not load this application.</p>}

        {application && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {application.jobId && (
                <Link to={`/jobs/${application.jobId}`} className="text-indigo-700 underline">
                  View the job on this board
                </Link>
              )}
              {application.url && (
                <a href={application.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-700 underline">
                  Original posting <FaExternalLinkAlt aria-hidden className="text-xs" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </div>

            <div>
              <label htmlFor="panel-stage" className={labelClass}>Stage</label>
              <select
                id="panel-stage"
                className={inputClass}
                value={application.stage}
                onChange={(e) => {
                  const stage = ApplicationStageSchema.safeParse(e.target.value);
                  if (stage.success) updateApplication.mutate({ id: application.id, input: { stage: stage.data } });
                }}
              >
                {APPLICATION_STAGES.map((stage) => (
                  <option key={stage} value={stage}>{APPLICATION_STAGE_LABELS[stage]}</option>
                ))}
              </select>
            </div>

            <DetailsForm key={`${application.id}-${application.updatedAt}`} application={application} />

            <section aria-labelledby="history-heading">
              <h3 id="history-heading" className="text-lg font-bold mb-3">Stage history</h3>
              <ol className="border-l-2 border-indigo-200 ml-2 space-y-3">
                {[...application.events].reverse().map((event) => (
                  <li key={event.id} className="ml-4 relative">
                    <span className="absolute -left-[1.4rem] top-1.5 h-3 w-3 rounded-full bg-indigo-500" aria-hidden />
                    <p className="font-semibold">
                      {event.fromStage
                        ? `${APPLICATION_STAGE_LABELS[event.fromStage]} → ${APPLICATION_STAGE_LABELS[event.toStage]}`
                        : `Added as ${APPLICATION_STAGE_LABELS[event.toStage]}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      <time dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time>
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <button
              type="button"
              onClick={onDelete}
              disabled={deleteApplication.isPending}
              className="text-red-600 hover:text-red-800 underline disabled:opacity-50"
            >
              Remove from tracker
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default ApplicationPanel;

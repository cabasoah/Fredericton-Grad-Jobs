import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LuArrowUpRight, LuExternalLink, LuTrash2, LuX } from "react-icons/lu";
import {
  APPLICATION_STAGE_LABELS,
  APPLICATION_STAGES,
  ApplicationStageSchema,
  type ApplicationWithEvents,
} from "@fredericton-grad-jobs/shared";
import { formatDateTime, fromDateInputValue, toDateInputValue } from "@/lib/dates";
import { useApplication, useDeleteApplication, useUpdateApplication } from "@/lib/queries/applications";
import { STAGE_STYLES } from "@/lib/stageStyles";
import { buttonPrimary, inputClass, labelClass, selectClass, textareaClass } from "@/lib/styles";

type ApplicationPanelProps = {
  applicationId: string;
  onClose: () => void;
};

const sectionLabel = "text-[11px] font-semibold uppercase tracking-wider text-slate-500";

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
    <form onSubmit={onSubmit} className="space-y-5">
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
        <textarea id="panel-notes" rows={6} className={textareaClass} placeholder="Contacts, interview prep, what to ask next..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <button type="submit" disabled={updateApplication.isPending} className={buttonPrimary}>
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
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-overlay"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          {application ? (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STAGE_STYLES[application.stage].pill}`}>
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${STAGE_STYLES[application.stage].dot}`} />
              {APPLICATION_STAGE_LABELS[application.stage]}
            </span>
          ) : <span />}
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close details"
          >
            <LuX aria-hidden className="text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {application && <p className="text-sm font-medium text-indigo-600">{application.companyName}</p>}
          <h2 id="panel-title" className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">
            {application?.roleTitle ?? "Application"}
          </h2>

          {status === "pending" && <p className="mt-4 animate-pulse text-sm text-slate-500" role="status">Loading...</p>}
          {status === "error" && <p className="mt-4 text-sm text-rose-600" role="alert">Could not load this application.</p>}

          {application && (
            <div className="mt-6 space-y-7">
              {(application.jobId ?? application.url) && (
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {application.jobId && (
                    <Link to={`/jobs/${application.jobId}`} className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700">
                      View the job on this board <LuArrowUpRight aria-hidden />
                    </Link>
                  )}
                  {application.url && (
                    <a href={application.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700">
                      Original posting <LuExternalLink aria-hidden />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  )}
                </div>
              )}

              <div className="rounded-xl bg-indigo-50/60 p-4">
                <label htmlFor="panel-stage" className={labelClass}>Stage</label>
                <select
                  id="panel-stage"
                  className={`${selectClass} bg-white`}
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
                <h3 id="history-heading" className={`${sectionLabel} mb-4`}>Stage history</h3>
                <ol className="space-y-4 border-l border-slate-200 pl-5">
                  {[...application.events].reverse().map((event, index) => (
                    <li key={event.id} className="relative">
                      <span
                        aria-hidden
                        className={`absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full ring-4 ring-white ${index === 0 ? STAGE_STYLES[event.toStage].dot : "bg-slate-300"}`}
                      />
                      <p className="text-sm font-medium text-slate-900">
                        {event.fromStage
                          ? `${APPLICATION_STAGE_LABELS[event.fromStage]} → ${APPLICATION_STAGE_LABELS[event.toStage]}`
                          : `Added as ${APPLICATION_STAGE_LABELS[event.toStage]}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        <time dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time>
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}
        </div>

        {application && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteApplication.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              <LuTrash2 aria-hidden /> Remove from tracker
            </button>
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Close
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default ApplicationPanel;

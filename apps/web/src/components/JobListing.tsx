import { Link } from "react-router-dom";
import { LuClock, LuMapPin } from "react-icons/lu";
import type { Job } from "@fredericton-grad-jobs/shared";
import { truncateDescription } from "@/lib/truncateDescription";
import { formatSalary } from "@/lib/formatSalary";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { descriptionText } from "@/lib/description";
import { cardInteractive } from "@/lib/styles";
import { JobTypeBadge, RemoteBadge, Tag } from "./Badge";
import CompanyAvatar from "./CompanyAvatar";
import SaveJobButton from "./SaveJobButton";

// The fields the card shows; a full Job, or the post-a-job form's preview.
export type JobCardData = Pick<
  Job,
  "title" | "description" | "type" | "remote" | "location" | "salaryMin" | "salaryMax" | "currency" | "tags" | "source"
> & { id?: string; postedAt?: string; company: { name: string } };

type JobListingProps = {
  job: JobCardData;
  // Preview mode (post-a-job form): no link and no save button.
  preview?: boolean;
};

const MAX_TAGS = 3;

const SOURCE_LABELS: Partial<Record<Job["source"], string>> = {
  GREENHOUSE: "via Greenhouse",
  LEVER: "via Lever",
};

// Job card. The title links to the job page, and the link covers the whole
// card; the save button sits above it so it stays clickable.
const JobListing = ({ job, preview = false }: JobListingProps) => {
  // Imported jobs have HTML descriptions; cards show plain text.
  const description = truncateDescription(descriptionText(job)).text;
  const salary = formatSalary(job);
  const extraTags = job.tags.length - MAX_TAGS;
  const source = SOURCE_LABELS[job.source];

  return (
    <article className={`${preview ? "rounded-2xl border border-slate-200 bg-white shadow-card" : cardInteractive} relative flex h-full flex-col p-5`}>
      <div className="flex items-start gap-3">
        <CompanyAvatar name={job.company.name || "?"} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{job.company.name}</p>
          <p className="flex items-center gap-1 truncate text-[13px] text-slate-500">
            <LuMapPin aria-hidden className="shrink-0" />
            <span className="truncate">{job.location}</span>
          </p>
        </div>
        {!preview && job.id && <SaveJobButton jobId={job.id} jobTitle={job.title} variant="icon" />}
      </div>

      <h3 className="mt-4 text-base font-semibold leading-snug tracking-tight text-slate-900">
        {preview || !job.id ? (
          job.title
        ) : (
          <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-indigo-500">
            {job.title}
          </Link>
        )}
      </h3>

      {description && <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-600">{description}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex flex-wrap gap-1.5">
          <JobTypeBadge type={job.type} />
          <RemoteBadge remote={job.remote} />
        </div>
        <p className={`ml-auto text-sm font-semibold ${salary === "Salary not listed" ? "font-normal text-slate-400" : "text-emerald-700"}`}>
          {salary}
        </p>
      </div>

      {job.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {job.tags.slice(0, MAX_TAGS).map((tag) => (
            <li key={tag}><Tag>{tag}</Tag></li>
          ))}
          {extraTags > 0 && <li className="self-center text-xs text-slate-500">+{extraTags} more</li>}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-slate-500">
        {job.postedAt ? (
          <span className="flex items-center gap-1">
            <LuClock aria-hidden />
            Posted <time dateTime={job.postedAt}>{formatRelativeTime(job.postedAt)}</time>
          </span>
        ) : (
          <span>Not posted yet</span>
        )}
        {source && <span>{source}</span>}
      </div>
    </article>
  );
};

export default JobListing;

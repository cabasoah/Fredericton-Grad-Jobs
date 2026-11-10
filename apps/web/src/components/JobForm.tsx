import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LuBriefcase, LuEye, LuLightbulb } from "react-icons/lu";
import {
  CURRENCIES,
  JOB_TYPE_LABELS,
  JOB_TYPES,
  REMOTE_TYPE_LABELS,
  REMOTE_TYPES,
  type Job,
  type JobType,
  type RemoteType,
} from "@fredericton-grad-jobs/shared";
import { describeError } from "@/lib/api";
import {
  buttonGhost,
  buttonPrimary,
  card,
  eyebrow,
  hintClass,
  inputClass,
  labelClass,
  pageContainer,
  selectClass,
  textareaClass,
} from "@/lib/styles";
import JobListing from "./JobListing";

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T =>
  values.some((option) => option === value);

// Required fields get a red asterisk from CSS, so it is not part of the
// label's accessible name.
const requiredLabel = `${labelClass} after:ml-0.5 after:text-rose-500 after:content-['*']`;
const smallLabel = "mb-1 block text-xs text-slate-500";

// Job fields collected by the form, in the API's shape.
export type JobFormFields = {
  title: string;
  description: string;
  type: JobType;
  remote: RemoteType;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  tags: string[];
  externalUrl: string | null;
};

type JobFormProps = {
  heading: string;
  submitLabel: string;
  submittingLabel: string;
  // The company the job is posted for (the employer's own company).
  companyName: string;
  // Edit mode: prefill from this job.
  initialJob?: Job;
  // Should throw if the save fails; ZodError and ApiError details are shown
  // under the form.
  onSubmit: (fields: JobFormFields) => Promise<void>;
};

const toAmount = (value: string) => (value.trim() === "" ? null : Number(value));
const splitTags = (value: string) => value.split(",").map((tag) => tag.trim()).filter(Boolean);

// The preview ignores amounts that are not numbers yet.
const previewAmount = (value: string) => {
  const amount = toAmount(value);
  return amount !== null && Number.isFinite(amount) ? amount : null;
};

const JobForm = ({ heading, submitLabel, submittingLabel, companyName, initialJob, onSubmit }: JobFormProps) => {
    const [title, setTitle] = useState(initialJob?.title ?? "");
    const [description, setDescription] = useState(initialJob?.description ?? "");
    const [location, setLocation] = useState(initialJob?.location ?? "");
    const [type, setType] = useState<JobType>(initialJob?.type ?? "FULL_TIME");
    const [remote, setRemote] = useState<RemoteType>(initialJob?.remote ?? "ONSITE");
    const [salaryMin, setSalaryMin] = useState(initialJob?.salaryMin?.toString() ?? "");
    const [salaryMax, setSalaryMax] = useState(initialJob?.salaryMax?.toString() ?? "");
    const [currency, setCurrency] = useState<string>(initialJob?.currency ?? "CAD");
    const [tags, setTags] = useState(initialJob?.tags.join(", ") ?? "");
    const [externalUrl, setExternalUrl] = useState(initialJob?.externalUrl ?? "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<{ message: string; details: string[] } | null>(null);

    // Keep a saved currency selectable even if the form does not offer it.
    const currencyOptions: readonly string[] = isOneOf(CURRENCIES, currency) ? CURRENCIES : [currency, ...CURRENCIES];

    const submitForm = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);

      const fields: JobFormFields = {
        title,
        description,
        type,
        remote,
        location,
        salaryMin: toAmount(salaryMin),
        salaryMax: toAmount(salaryMax),
        currency,
        tags: splitTags(tags),
        externalUrl: externalUrl.trim() === "" ? null : externalUrl.trim(),
      };
      try {
        await onSubmit(fields);
      } catch (err) {
        console.error("Error saving job", err);
        setError(describeError(err));
        setSubmitting(false);
      }
    };

  return (
    <div className={`${pageContainer} py-10`}>
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 sm:flex-row sm:items-center sm:p-8">
        <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white shadow-sm">
          <LuBriefcase />
        </span>
        <div>
          <p className={eyebrow}>Employer</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{heading}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Posting as <span className="font-semibold text-slate-900">{companyName}</span>
          </p>
          <p className="text-xs text-slate-500">Jobs are always posted for your own company.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_24rem]">
        <form onSubmit={(e) => void submitForm(e)} className={`${card} p-6 sm:p-8`}>
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Position details</h2>
            <p className="text-xs text-slate-500"><span className="text-rose-500">*</span> Required</p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="title" className={requiredLabel}>Job title</label>
              <input
                type="text"
                id="title"
                name="title"
                className={inputClass}
                placeholder="eg. Junior Software Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <p className={hintClass}>Words like &quot;junior&quot; or &quot;new grad&quot; help graduates find the role.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="type" className={requiredLabel}>Job type</label>
                <select
                  id="type"
                  name="type"
                  className={selectClass}
                  value={type}
                  onChange={(e) => { if (isOneOf(JOB_TYPES, e.target.value)) setType(e.target.value); }}
                  required
                >
                  {JOB_TYPES.map((option) => (
                    <option key={option} value={option}>{JOB_TYPE_LABELS[option]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="remote" className={requiredLabel}>Work arrangement</label>
                <select
                  id="remote"
                  name="remote"
                  className={selectClass}
                  value={remote}
                  onChange={(e) => { if (isOneOf(REMOTE_TYPES, e.target.value)) setRemote(e.target.value); }}
                  required
                >
                  {REMOTE_TYPES.map((option) => (
                    <option key={option} value={option}>{REMOTE_TYPE_LABELS[option]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="location" className={requiredLabel}>Location</label>
              <input
                type="text"
                id="location"
                name="location"
                className={inputClass}
                placeholder="eg. Fredericton, NB"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <fieldset>
              <legend className={labelClass}>
                Annual salary range <span className="font-normal text-slate-500">(optional)</span>
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_7rem]">
                <div>
                  <label htmlFor="salary_min" className={smallLabel}>Minimum</label>
                  <input
                    type="number"
                    id="salary_min"
                    name="salary_min"
                    className={inputClass}
                    min={0}
                    step={1}
                    placeholder="eg. 60000"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="salary_max" className={smallLabel}>Maximum</label>
                  <input
                    type="number"
                    id="salary_max"
                    name="salary_max"
                    className={inputClass}
                    min={0}
                    step={1}
                    placeholder="eg. 75000"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="currency" className={smallLabel}>Currency</label>
                  <select
                    id="currency"
                    name="currency"
                    className={selectClass}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {currencyOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            <div>
              <label htmlFor="tags" className={labelClass}>Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                className={inputClass}
                placeholder="eg. react, typescript, sql"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className={hintClass}>Separate skills with commas. Graduates can filter by them.</p>
            </div>

            <div>
              <label htmlFor="external_url" className={labelClass}>Application link</label>
              <input
                type="url"
                id="external_url"
                name="external_url"
                className={inputClass}
                placeholder="Optional, eg. https://example.com/careers/123"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
              <p className={hintClass}>Shown as an Apply button on the job page.</p>
            </div>

            <div>
              <label htmlFor="description" className={requiredLabel}>Job description</label>
              <textarea
                id="description"
                name="description"
                className={textareaClass}
                rows={10}
                placeholder="What the role involves, what you expect from a new graduate, and how you support them"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                <p className="font-medium">{error.message}</p>
                {error.details.length > 0 && (
                  <ul className="ml-5 mt-1 list-disc">
                    {error.details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
            <Link to={initialJob ? `/jobs/${initialJob.id}` : "/jobs"} className={buttonGhost}>Cancel</Link>
            <button className={`${buttonPrimary} px-6`} type="submit" disabled={submitting}>
              {submitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </form>

        <aside className="space-y-5 lg:sticky lg:top-24" aria-label="Preview">
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <LuEye aria-hidden className="text-indigo-600" /> Live preview
            </h2>
            <JobListing
              preview
              job={{
                title: title.trim() || "Job title",
                description,
                type,
                remote,
                location: location.trim() || "Location",
                salaryMin: previewAmount(salaryMin),
                salaryMax: previewAmount(salaryMax),
                currency,
                tags: splitTags(tags),
                source: "MANUAL",
                postedAt: initialJob?.postedAt,
                company: { name: companyName },
              }}
            />
            <p className="mt-2 text-xs text-slate-500">How the job appears in search results.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <LuLightbulb aria-hidden className="text-amber-600" /> Tips for graduate-friendly postings
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
              <li>Say what training or mentorship a new graduate gets.</li>
              <li>Ask for what the role needs, not years of experience.</li>
              <li>Include a salary range, and list the skills as tags.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default JobForm

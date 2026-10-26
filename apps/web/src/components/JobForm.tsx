import { useState, type FormEvent } from "react";
import {
  CURRENCIES,
  JOB_TYPE_LABELS,
  JOB_TYPES,
  REMOTE_TYPE_LABELS,
  REMOTE_TYPES,
  type CompanyInput,
  type Job,
  type JobType,
  type RemoteType,
} from "@fredericton-grad-jobs/shared";
import { describeError } from "@/lib/api";

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T =>
  values.some((option) => option === value);

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
};

type JobFormProps = {
  heading: string;
  submitLabel: string;
  submittingLabel: string;
  // Edit mode: prefill from this job and show its company read-only.
  initialJob?: Job;
  // company is only set when adding a job. Should throw if the save fails;
  // ZodError and ApiError details are shown under the form.
  onSubmit: (fields: JobFormFields, company?: CompanyInput) => Promise<void>;
};

const toAmount = (value: string) => (value.trim() === "" ? null : Number(value));
const optionalText = (value: string) => (value.trim() === "" ? undefined : value.trim());

const JobForm = ({ heading, submitLabel, submittingLabel, initialJob, onSubmit }: JobFormProps) => {
    const [title, setTitle] = useState(initialJob?.title ?? "");
    const [description, setDescription] = useState(initialJob?.description ?? "");
    const [location, setLocation] = useState(initialJob?.location ?? "");
    const [type, setType] = useState<JobType>(initialJob?.type ?? "FULL_TIME");
    const [remote, setRemote] = useState<RemoteType>(initialJob?.remote ?? "ONSITE");
    const [salaryMin, setSalaryMin] = useState(initialJob?.salaryMin?.toString() ?? "");
    const [salaryMax, setSalaryMax] = useState(initialJob?.salaryMax?.toString() ?? "");
    const [currency, setCurrency] = useState<string>(initialJob?.currency ?? "CAD");
    const [tags, setTags] = useState(initialJob?.tags.join(", ") ?? "");
    const [companyName, setCompanyName] = useState("");
    const [companyDescription, setCompanyDescription] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
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
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };
      const company: CompanyInput | undefined = initialJob
        ? undefined
        : {
            name: companyName.trim(),
            description: optionalText(companyDescription),
            website: optionalText(companyWebsite),
            contactEmail: optionalText(contactEmail),
            contactPhone: optionalText(contactPhone),
          };

      try {
        await onSubmit(fields, company);
      } catch (err) {
        console.error("Error saving job", err);
        setError(describeError(err));
        setSubmitting(false);
      }
    };

  return (
     <section className="bg-indigo-50">
      <div className="container m-auto max-w-2xl py-24">
        <div
          className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0"
        >
          <form onSubmit={(e) => void submitForm(e)}>
            <h2 className="text-3xl text-center font-semibold mb-6">{heading}</h2>

            <div className="mb-4">
              <label htmlFor="type" className="block text-gray-700 font-bold mb-2"
                >Job Type</label
              >
              <select
                id="type"
                name="type"
                className="border rounded w-full py-2 px-3"
                value={type}
                onChange={(e) => { if (isOneOf(JOB_TYPES, e.target.value)) setType(e.target.value); }}
                required
              >
                {JOB_TYPES.map((option) => (
                  <option key={option} value={option}>{JOB_TYPE_LABELS[option]}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="remote" className="block text-gray-700 font-bold mb-2"
                >Work Arrangement</label
              >
              <select
                id="remote"
                name="remote"
                className="border rounded w-full py-2 px-3"
                value={remote}
                onChange={(e) => { if (isOneOf(REMOTE_TYPES, e.target.value)) setRemote(e.target.value); }}
                required
              >
                {REMOTE_TYPES.map((option) => (
                  <option key={option} value={option}>{REMOTE_TYPE_LABELS[option]}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 font-bold mb-2"
                >Job Listing Name</label
              >
              <input
                type="text"
                id="title"
                name="title"
                className="border rounded w-full py-2 px-3 mb-2"
                placeholder="eg. Senior React Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-gray-700 font-bold mb-2"
                >Description</label
              >
              <textarea
                id="description"
                name="description"
                className="border rounded w-full py-2 px-3"
                rows={4}
                placeholder="Add any job duties, expectations, requirements, etc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            <fieldset className="mb-4">
              <legend className="block text-gray-700 font-bold mb-2">Salary (per year, optional)</legend>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <div>
                  <label htmlFor="salary_min" className="block text-gray-600 text-sm mb-1">Minimum</label>
                  <input
                    type="number"
                    id="salary_min"
                    name="salary_min"
                    className="border rounded w-full py-2 px-3"
                    min={0}
                    step={1000}
                    placeholder="eg. 60000"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="salary_max" className="block text-gray-600 text-sm mb-1">Maximum</label>
                  <input
                    type="number"
                    id="salary_max"
                    name="salary_max"
                    className="border rounded w-full py-2 px-3"
                    min={0}
                    step={1000}
                    placeholder="eg. 75000"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-gray-600 text-sm mb-1">Currency</label>
                  <select
                    id="currency"
                    name="currency"
                    className="border rounded w-full py-2 px-3"
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

            <div className='mb-4'>
              <label htmlFor='location' className='block text-gray-700 font-bold mb-2'>
                Location
              </label>
              <input
                type='text'
                id='location'
                name='location'
                className='border rounded w-full py-2 px-3 mb-2'
                placeholder='Company Location'
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="tags" className="block text-gray-700 font-bold mb-2">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                className="border rounded w-full py-2 px-3"
                placeholder="Comma separated, eg. react, typescript"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <h3 className="text-2xl mb-5">Company Info</h3>

            {initialJob ? (
              <div className="mb-4">
                <p className="font-bold">{initialJob.company.name}</p>
                <p className="text-gray-600 text-sm">
                  Company details can't be changed from this form yet.
                </p>
              </div>
            ) : (
              <>
            <div className="mb-4">
              <label htmlFor="company" className="block text-gray-700 font-bold mb-2"
                >Company Name</label
              >
              <input
                type="text"
                id="company"
                name="company"
                className="border rounded w-full py-2 px-3"
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="company_description"
                className="block text-gray-700 font-bold mb-2"
                >Company Description</label
              >
              <textarea
                id="company_description"
                name="company_description"
                className="border rounded w-full py-2 px-3"
                rows={4}
                placeholder="What does your company do?"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="mb-4">
              <label htmlFor="company_website" className="block text-gray-700 font-bold mb-2"
                >Company Website</label
              >
              <input
                type="url"
                id="company_website"
                name="company_website"
                className="border rounded w-full py-2 px-3"
                placeholder="Optional, eg. https://example.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="contact_email"
                className="block text-gray-700 font-bold mb-2"
                >Contact Email</label
              >
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                className="border rounded w-full py-2 px-3"
                placeholder="Email address for applicants"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="contact_phone"
                className="block text-gray-700 font-bold mb-2"
                >Contact Phone</label
              >
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                className="border rounded w-full py-2 px-3"
                placeholder="Optional phone for applicants"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
              </>
            )}

            {error && (
              <div className="text-red-600 mb-4" role="alert">
                <p>{error.message}</p>
                {error.details.length > 0 && (
                  <ul className="list-disc ml-5 mt-1">
                    {error.details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div>
              <button
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={submitting}
              >
                {submitting ? submittingLabel : submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default JobForm

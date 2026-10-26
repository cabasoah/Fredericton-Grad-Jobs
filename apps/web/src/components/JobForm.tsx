import { useState, type FormEvent } from "react";
import { JOB_TYPES, SALARY_OPTIONS, type JobInput, type JobType } from "@react-dev/shared";

const isJobType = (value: string): value is JobType =>
  JOB_TYPES.some((jobType) => jobType === value);

type JobFormProps = {
  heading: string;
  submitLabel: string;
  submittingLabel: string;
  initialJob?: JobInput;
  onSubmit: (job: JobInput) => Promise<void>;
};

// Shared form for adding and editing jobs. onSubmit receives the job object
// (same shape as jobs.json, without id) and should throw if the save fails.
const JobForm = ({ heading, submitLabel, submittingLabel, initialJob, onSubmit }: JobFormProps) => {
    const [title, setTitle] = useState(initialJob?.title ?? "");
    const [description, setDescription] = useState(initialJob?.description ?? "");
    const [location, setLocation] = useState(initialJob?.location ?? "");
    const [salary, setSalary] = useState<string>(initialJob?.salary ?? SALARY_OPTIONS[0]);
    const [type, setType] = useState<JobType>(initialJob?.type ?? "Full-Time");
    const [companyName, setCompanyName] = useState(initialJob?.company?.name ?? "");
    const [companyDescription, setCompanyDescription] = useState(initialJob?.company?.description ?? "");
    const [contactEmail, setContactEmail] = useState(initialJob?.company?.contactEmail ?? "");
    const [contactPhone, setContactPhone] = useState(initialJob?.company?.contactPhone ?? "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Keep a saved salary selectable even if it is not one of the standard ranges.
    const salaryOptions = SALARY_OPTIONS.some((option) => option === salary) ? SALARY_OPTIONS : [salary, ...SALARY_OPTIONS];

    const submitForm = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);
      setError("");

      const job: JobInput = {
        title,
        type,
        location,
        description,
        salary,
        company: {
          name: companyName,
          description: companyDescription,
          contactEmail,
          contactPhone,
        },
      };

      try {
        await onSubmit(job);
      } catch (err) {
        console.error("Error saving job", err);
        setError("Could not save the job. Please try again.");
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
                onChange={(e) => { if (isJobType(e.target.value)) setType(e.target.value); }}
                required
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
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
              ></textarea>
            </div>

            <div className="mb-4">
              <label htmlFor="salary" className="block text-gray-700 font-bold mb-2"
                >Salary</label
              >
              <select
                id="salary"
                name="salary"
                className="border rounded w-full py-2 px-3"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                required
              >
                {salaryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

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

            <h3 className="text-2xl mb-5">Company Info</h3>

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

            {error && (
              <p className="text-red-600 mb-4" role="alert">{error}</p>
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

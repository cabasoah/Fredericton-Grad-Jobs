import { useLoaderData, useNavigate } from "react-router-dom";
import { JobUpdateSchema } from "@fredericton-grad-jobs/shared";
import JobForm, { type JobFormFields } from "@/components/JobForm";
import { apiFetch, jsonRequest } from "@/lib/api";
import type { jobLoader } from "@/loaders/jobLoader";

const EditJobPage = () => {
    const job = useLoaderData<typeof jobLoader>();
    const navigate = useNavigate();

    const updateJob = async (fields: JobFormFields) => {
      // Same schema the API validates with; throws ZodError for the form to show.
      const body = JobUpdateSchema.parse(fields);
      await apiFetch(`/jobs/${encodeURIComponent(job.id)}`, jsonRequest("PATCH", body));
      void navigate(`/jobs/${job.id}`);
    };

  return (
    <JobForm
      key={job.id}
      heading="Edit Job"
      submitLabel="Update Job"
      submittingLabel="Updating Job..."
      initialJob={job}
      onSubmit={updateJob}
    />
  )
}

export default EditJobPage

import { useLoaderData, useNavigate } from "react-router-dom";
import { JobUpdateSchema } from "@fredericton-grad-jobs/shared";
import { useAuth } from "@/auth/AuthContext";
import AccessDenied from "@/components/AccessDenied";
import JobForm, { type JobFormFields } from "@/components/JobForm";
import { apiFetch, jsonRequest } from "@/lib/api";
import { canManageJob } from "@/lib/permissions";
import type { jobLoader } from "@/loaders/jobLoader";

// Rendered inside <RequireRole role="EMPLOYER">.
const EditJobPage = () => {
    const job = useLoaderData<typeof jobLoader>();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!canManageJob(user, job)) {
      return (
        <AccessDenied
          message={
            job.source === "MANUAL"
              ? "Only the employer who posted this job can edit it."
              : "Imported jobs cannot be edited."
          }
        />
      );
    }

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
      companyName={job.company.name}
      initialJob={job}
      onSubmit={updateJob}
    />
  )
}

export default EditJobPage

import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import AccessDenied from "@/components/AccessDenied";
import JobForm, { type JobFormFields } from "@/components/JobForm";
import { canManageJob } from "@/lib/permissions";
import { useJob, useUpdateJob } from "@/lib/queries/jobs";

// Rendered inside <RequireRole role="EMPLOYER">.
const EditJobPage = () => {
    const { id = "" } = useParams();
    const { data: job } = useJob(id);
    const { user } = useAuth();
    const navigate = useNavigate();
    const updateJob = useUpdateJob();

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

    // The API client validates with the shared schema first; a ZodError or
    // ApiError is shown under the form (and as a toast for API errors).
    const saveJob = async (fields: JobFormFields) => {
      await updateJob.mutateAsync({ id: job.id, input: fields });
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
      onSubmit={saveJob}
    />
  )
}

export default EditJobPage

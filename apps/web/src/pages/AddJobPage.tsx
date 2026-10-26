import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import AccessDenied from "@/components/AccessDenied";
import JobForm, { type JobFormFields } from "@/components/JobForm";
import { useCreateJob } from "@/lib/queries/jobs";

// Rendered inside <RequireRole role="EMPLOYER">.
const AddJobPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const createJob = useCreateJob();

    if (!user?.company) {
      return <AccessDenied message="Your employer account is not linked to a company." />;
    }

    // The API client validates with the shared schema first; a ZodError or
    // ApiError is shown under the form (and as a toast for API errors).
    const addJob = async (fields: JobFormFields) => {
      const createdJob = await createJob.mutateAsync(fields);
      void navigate(`/jobs/${createdJob.id}`);
    };

  return (
    <JobForm
      heading="Add Job"
      submitLabel="Add Job"
      submittingLabel="Adding Job..."
      companyName={user.company.name}
      onSubmit={addJob}
    />
  )
}

export default AddJobPage

import { useNavigate } from "react-router-dom";
import { JobCreateSchema, JobSchema } from "@fredericton-grad-jobs/shared";
import { useAuth } from "@/auth/AuthContext";
import AccessDenied from "@/components/AccessDenied";
import JobForm, { type JobFormFields } from "@/components/JobForm";
import { apiFetch, jsonRequest } from "@/lib/api";

// Rendered inside <RequireRole role="EMPLOYER">.
const AddJobPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user?.company) {
      return <AccessDenied message="Your employer account is not linked to a company." />;
    }

    const addJob = async (fields: JobFormFields) => {
      // Same schema the API validates with; throws ZodError for the form to show.
      const body = JobCreateSchema.parse(fields);
      const createdJob = JobSchema.parse(await apiFetch("/jobs", jsonRequest("POST", body)));
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

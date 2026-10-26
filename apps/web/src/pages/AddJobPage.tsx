import { useNavigate } from "react-router-dom";
import { JobCreateSchema, JobSchema, type CompanyInput } from "@fredericton-grad-jobs/shared";
import JobForm, { type JobFormFields } from "@/components/JobForm";
import { apiFetch, jsonRequest } from "@/lib/api";

const AddJobPage = () => {
    const navigate = useNavigate();

    const addJob = async (fields: JobFormFields, company?: CompanyInput) => {
      // Same schema the API validates with; throws ZodError for the form to show.
      const body = JobCreateSchema.parse({ ...fields, company });
      const createdJob = JobSchema.parse(await apiFetch("/jobs", jsonRequest("POST", body)));
      void navigate(`/jobs/${createdJob.id}`);
    };

  return (
    <JobForm
      heading="Add Job"
      submitLabel="Add Job"
      submittingLabel="Adding Job..."
      onSubmit={addJob}
    />
  )
}

export default AddJobPage

import { useLoaderData, useNavigate } from "react-router-dom";
import type { JobInput } from "@fredericton-grad-jobs/shared";
import JobForm from "@/components/JobForm";
import { API_URL } from "@/config";
import type { jobLoader } from "@/loaders/jobLoader";

const EditJobPage = () => {
    const job = useLoaderData<typeof jobLoader>();
    const navigate = useNavigate();

    const updateJob = async (updatedJob: JobInput) => {
      const res = await fetch(`${API_URL}/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedJob, id: job.id }),
      });
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
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

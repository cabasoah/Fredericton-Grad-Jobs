import { useLoaderData, useNavigate } from "react-router-dom";
import JobForm from "../components/JobForm";

const EditJobPage = () => {
    const job = useLoaderData();
    const navigate = useNavigate();

    const updateJob = async (updatedJob) => {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedJob, id: job.id }),
      });
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      navigate(`/jobs/${job.id}`);
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

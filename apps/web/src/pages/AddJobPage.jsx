import { useNavigate } from "react-router-dom";
import JobForm from "../components/JobForm";

const AddJobPage = () => {
    const navigate = useNavigate();

    const addJob = async (newJob) => {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      const createdJob = await res.json();
      navigate(`/jobs/${createdJob.id}`);
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

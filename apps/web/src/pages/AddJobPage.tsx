import { useNavigate } from "react-router-dom";
import { JobSchema, type JobInput } from "@react-dev/shared";
import JobForm from "@/components/JobForm";

const AddJobPage = () => {
    const navigate = useNavigate();

    const addJob = async (newJob: JobInput) => {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      const data: unknown = await res.json();
      const createdJob = JobSchema.parse(data);
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

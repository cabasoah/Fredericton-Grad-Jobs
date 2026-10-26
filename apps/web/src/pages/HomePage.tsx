import Hero from "@/components/Hero";
import HomeCards from "@/components/HomeCards";
import JobListings from "@/components/JobListings";
import ViewAllJobs from "@/components/ViewAllJobs";

const HomePage = () => {
  return (
    <>
        <Hero/>
        <HomeCards />
        <JobListings
          heading="Recent Jobs"
          pageSize={3}
          emptyState={<p className="text-center text-gray-600">No jobs posted yet.</p>}
        />
        <ViewAllJobs />
    </>
  )
}

export default HomePage
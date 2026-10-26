import Hero from "@/components/Hero";
import HomeCards from "@/components/HomeCards";
import JobListings from "@/components/JobListings";
import ViewAllJobs from "@/components/ViewAllJobs";
import { useStats } from "@/lib/queries/stats";
import { statsSummary } from "@/lib/statsSummary";

const HomePage = () => {
  // Live numbers from GET /stats; the Hero's default subtitle shows while
  // they load or if the request fails.
  const { data: stats } = useStats();

  return (
    <>
        <Hero subtitle={stats ? statsSummary(stats) : undefined}/>
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

import { Link } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import Hero from "@/components/Hero";
import HomeCards from "@/components/HomeCards";
import JobListings from "@/components/JobListings";
import { useStats } from "@/lib/queries/stats";
import { card, pageContainer } from "@/lib/styles";

const count = new Intl.NumberFormat("en-CA");

const StatTile = ({ value, label, detail }: { value: number; label: string; detail: string }) => (
  <div className="px-6 py-5">
    <p className="text-3xl font-semibold tracking-tight text-slate-900">{count.format(value)}</p>
    <p className="mt-1 text-sm font-medium text-slate-800">{label}</p>
    <p className="text-xs text-slate-500">{detail}</p>
  </div>
);

const HomePage = () => {
  // Live numbers from GET /stats; the tiles are left out while they load or
  // if the request fails.
  const { data: stats } = useStats();

  return (
    <>
      <Hero stats={stats} />

      <div className={`${pageContainer} space-y-16`}>
        {stats && (
          <div className={`${card} mx-auto grid max-w-4xl grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0`}>
            <StatTile value={stats.openJobs} label="Open roles" detail="Across every source" />
            <StatTile
              value={stats.openJobsBySource.GREENHOUSE + stats.openJobsBySource.LEVER}
              label="Imported postings"
              detail="From public Greenhouse and Lever boards"
            />
            <StatTile value={stats.openJobsBySource.MANUAL} label="Posted here" detail="By employers on this site" />
          </div>
        )}

        <HomeCards />

        <section aria-labelledby="recent-jobs">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="recent-jobs" className="text-xl font-semibold tracking-tight text-slate-900">Recent jobs</h2>
              <p className="text-sm text-slate-500">The newest openings on the board.</p>
            </div>
            <Link to="/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all jobs <LuArrowRight aria-hidden />
            </Link>
          </div>
          <JobListings
            pageSize={3}
            columns={3}
            emptyState={<p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No jobs posted yet.</p>}
          />
        </section>
      </div>
    </>
  )
}

export default HomePage

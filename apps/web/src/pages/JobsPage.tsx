import { Link, useSearchParams } from "react-router-dom"
import { LuBriefcase } from "react-icons/lu"
import ActiveFilters from "@/components/ActiveFilters"
import JobFiltersBar, { SortSelect } from "@/components/JobFiltersBar"
import JobListings from "@/components/JobListings"
import { filtersFromSearchParams, hasActiveFilters } from "@/lib/jobFilters"
import { useStats } from "@/lib/queries/stats"
import { useSearchParamsUpdater } from "@/lib/useSearchParamsUpdater"
import { buttonPrimary, card, eyebrow, pageContainer } from "@/lib/styles"

const count = new Intl.NumberFormat("en-CA");

const JobsPage = () => {
  const [searchParams] = useSearchParams();
  const updateSearchParams = useSearchParamsUpdater();
  const { data: stats } = useStats();
  const filters = filtersFromSearchParams(searchParams);
  const filtered = hasActiveFilters(filters);

  const clearFilters = () => {
    // Keep the chosen sort order; drop everything that narrows the results.
    updateSearchParams((next) => {
      for (const key of [...next.keys()]) {
        if (key !== "sort") next.delete(key);
      }
    });
  };

  return (
    <div className={`${pageContainer} py-10`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`${eyebrow} flex items-center gap-2`}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Fredericton &amp; Atlantic Canada
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Jobs</h1>
          {stats && (
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{count.format(stats.openJobs)}</span> open graduate and student roles
            </p>
          )}
        </div>
        <SortSelect />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[17.5rem_1fr]">
        <aside className="lg:sticky lg:top-24">
          <JobFiltersBar onReset={filtered ? clearFilters : undefined} />
        </aside>

        <section aria-label="Results">
          <ActiveFilters onClearAll={clearFilters} />
          <JobListings
            filters={filters}
            pageSize={20}
            columns={2}
            showLoadMore
            emptyState={
              <div className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600">
                  <LuBriefcase aria-hidden />
                </span>
                {filtered ? (
                  <>
                    <p className="font-semibold text-slate-900">No jobs match these filters</p>
                    <p className="mt-1 mb-5 text-sm text-slate-500">Try a broader search or remove a filter.</p>
                    <button onClick={clearFilters} className={buttonPrimary}>Clear filters</button>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No jobs posted yet.</p>
                )}
              </div>
            }
          />
        </section>
      </div>

      <div className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-900">Hiring graduates in Atlantic Canada?</p>
          <p className="mt-1 text-sm text-slate-600">Create an employer account and post your role next to these openings.</p>
        </div>
        <Link to="/add-job" className={buttonPrimary}>Post a job</Link>
      </div>
    </div>
  )
}

export default JobsPage

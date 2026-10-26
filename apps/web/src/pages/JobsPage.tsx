import { useSearchParams } from "react-router-dom"
import JobFiltersBar from "@/components/JobFiltersBar"
import JobListings from "@/components/JobListings"
import { filtersFromSearchParams, hasActiveFilters } from "@/lib/jobFilters"
import { useSearchParamsUpdater } from "@/lib/useSearchParamsUpdater"

const JobsPage = () => {
  const [searchParams] = useSearchParams();
  const updateSearchParams = useSearchParamsUpdater();
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
    <section className="bg-blue-50">
        <JobFiltersBar />
        <JobListings
          heading="Browse Jobs"
          filters={filters}
          pageSize={20}
          showLoadMore
          emptyState={
            filtered ? (
              <div className="text-center">
                <p className="text-gray-700 text-lg mb-4">No jobs match these filters.</p>
                <button
                  onClick={clearFilters}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <p className="text-center text-gray-600">No jobs posted yet.</p>
            )
          }
        />
    </section>
  )
}

export default JobsPage

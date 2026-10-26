import type { ReactNode } from 'react';
import type { JobFilters } from '@/lib/api';
import { useJobs } from '@/lib/queries/jobs';
import JobCardSkeleton from './JobCardSkeleton';
import JobListing from './JobListing';

type JobListingsProps = {
  heading: string;
  filters?: JobFilters;
  pageSize: number;
  // Show a "Load more" button while the API reports more pages.
  showLoadMore?: boolean;
  // Shown when the request succeeds with no jobs.
  emptyState: ReactNode;
};

const skeletons = (count: number) =>
  Array.from({ length: count }, (_, index) => <JobCardSkeleton key={`skeleton-${index}`} />);

const JobListings = ({ heading, filters = {}, pageSize, showLoadMore = false, emptyState }: JobListingsProps) => {
  const { data, status, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useJobs(filters, pageSize);
  const jobs = data?.pages.flatMap((page) => page.data) ?? [];

  return (
      <section className="bg-blue-50 px-4 py-10">
        <div className="container-xl lg:container m-auto">
          <h2 className="text-3xl font-bold text-indigo-500 mb-6 text-center">
            {heading}
          </h2>
            { status === 'pending' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="status" aria-label="Loading jobs">
                {skeletons(Math.min(pageSize, 6))}
              </div>
            ) : status === 'error' ? (
              <div className="text-center" role="alert">
                <p className="text-red-600 mb-4">Could not load jobs. Please try again.</p>
                <button
                  onClick={() => void refetch()}
                  disabled={isRefetching}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {isRefetching ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            ) : jobs.length === 0 ? (
              emptyState
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <JobListing key={job.id} job={job} />
                ))}
                {isFetchingNextPage && skeletons(3)}
              </div>
              {showLoadMore && hasNextPage && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
              </>
            )}

        </div>
      </section>
  )
}

export default JobListings

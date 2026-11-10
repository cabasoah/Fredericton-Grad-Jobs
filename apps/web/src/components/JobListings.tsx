import type { ReactNode } from 'react';
import type { JobFilters } from '@/lib/api';
import { useJobs } from '@/lib/queries/jobs';
import { buttonPrimary, buttonSecondary } from '@/lib/styles';
import JobCardSkeleton from './JobCardSkeleton';
import JobListing from './JobListing';

type JobListingsProps = {
  filters?: JobFilters;
  pageSize: number;
  // Cards per row on wide screens.
  columns?: 1 | 2 | 3;
  // Show a "Load more" button while the API reports more pages.
  showLoadMore?: boolean;
  // Shown when the request succeeds with no jobs.
  emptyState: ReactNode;
};

const GRID = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

const skeletons = (count: number) =>
  Array.from({ length: count }, (_, index) => <JobCardSkeleton key={`skeleton-${index}`} />);

const JobListings = ({ filters = {}, pageSize, columns = 2, showLoadMore = false, emptyState }: JobListingsProps) => {
  const { data, status, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useJobs(filters, pageSize);
  const jobs = data?.pages.flatMap((page) => page.data) ?? [];
  const grid = `grid gap-4 ${GRID[columns]}`;

  if (status === 'pending') {
    return (
      <div className={grid} role="status" aria-label="Loading jobs">
        {skeletons(Math.min(pageSize, 6))}
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center" role="alert">
        <p className="mb-4 text-sm text-rose-700">Could not load jobs. Please try again.</p>
        <button onClick={() => void refetch()} disabled={isRefetching} className={buttonPrimary}>
          {isRefetching ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }
  if (jobs.length === 0) return emptyState;

  return (
    <>
      <div className={grid}>
        {jobs.map((job) => (
          <JobListing key={job.id} job={job} />
        ))}
        {isFetchingNextPage && skeletons(2)}
      </div>
      {showLoadMore && hasNextPage && (
        <div className="mt-8 text-center">
          <button onClick={() => void fetchNextPage()} disabled={isFetchingNextPage} className={`${buttonSecondary} px-6`}>
            {isFetchingNextPage ? 'Loading...' : 'Load more jobs'}
          </button>
        </div>
      )}
    </>
  );
}

export default JobListings

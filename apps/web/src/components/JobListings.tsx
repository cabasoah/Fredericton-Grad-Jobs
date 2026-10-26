import { useState,useEffect } from 'react';
import { JobListResponseSchema, type Job } from '@fredericton-grad-jobs/shared';
import { apiFetch } from '@/lib/api';
import JobListing from './JobListing';
import Spinner from './Spinner';

type JobListingsProps = {
  isHome?: boolean;
};

const HOME_LIMIT = 3;
const PAGE_LIMIT = 20;

const fetchJobsPage = async (limit: number, cursor?: string) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return JobListResponseSchema.parse(await apiFetch(`/jobs?${params.toString()}`));
};

const JobListings = ({isHome = false}: JobListingsProps) => {
  const[jobs, setJobs] = useState<Job[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const page = await fetchJobsPage(isHome ? HOME_LIMIT : PAGE_LIMIT);
        setJobs(page.data);
        setNextCursor(page.nextCursor);
      } catch (error) {
        console.log('Error fetching data',error);
        setError(true);
      }finally{
        setLoading(false);
      }

    };

    void fetchJobs();
  },[isHome, reloadCount]);

  const retry = () => {
    setError(false);
    setLoading(true);
    setReloadCount((count) => count + 1);
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await fetchJobsPage(PAGE_LIMIT, nextCursor);
      setJobs((current) => [...current, ...page.data]);
      setNextCursor(page.nextCursor);
    } catch (error) {
      console.log('Error fetching more jobs', error);
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
      <section className="bg-blue-50 px-4 py-10">
        <div className="container-xl lg:container m-auto">
          <h2 className="text-3xl font-bold text-indigo-500 mb-6 text-center">
            {isHome ? "Recent Jobs": "Browse Jobs"}
          </h2>
            { loading ? (<Spinner loading={loading}/>) : error ? (
              <div className="text-center" role="alert">
                <p className="text-red-600 mb-4">Could not load jobs. Please try again.</p>
                <button
                  onClick={retry}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-center text-gray-600">No jobs posted yet.</p>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <JobListing key={job.id} job={job} />
                ))}
              </div>
              {!isHome && nextCursor && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => void loadMore()}
                    disabled={loadingMore}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
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

import { useState,useEffect } from 'react'; 
import JobListing from './JobListing';
import Spinner from './Spinner';


const JobListings = ({isHome = false}) => {
  //  const jobsListings = isHome ? jobs.slice(0, 3): jobs;
  const[jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const fetchJobs = async () => {
      const apiUrl = isHome ? '/api/jobs?_limit=3' : '/api/jobs';
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const data = await res.json();
        setJobs(data);
      } catch (error) {
        console.log('Error fetching data',error);
        setError(true);
      }finally{
        setLoading(false);
      }

    };

    fetchJobs();
  },[isHome, reloadCount]);

  const retry = () => {
    setError(false);
    setLoading(true);
    setReloadCount((count) => count + 1);
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <JobListing key={job.id} job={job} />
                ))}
              </div>
            )}
          
        </div>
      </section>
  )
}

export default JobListings
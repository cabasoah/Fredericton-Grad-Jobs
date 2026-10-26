import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaExternalLinkAlt, FaMapMarker } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { JOB_TYPE_LABELS, REMOTE_TYPE_LABELS } from '@fredericton-grad-jobs/shared';
import { useAuth } from '@/auth/AuthContext';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { formatSalaryRange } from '@/lib/formatSalary';
import { canManageJob } from '@/lib/permissions';
import { useDeleteJob, useJob } from '@/lib/queries/jobs';

const JobPage = () => {
    const { id = '' } = useParams();
    const { data: jobData } = useJob(id);
    const { user } = useAuth();
    const canManage = canManageJob(user, jobData);
    const navigate = useNavigate();
    const deleteJob = useDeleteJob();

    // Optimistic: leave for the list straight away. The job is already gone
    // from it; if the delete fails it is restored and a toast explains why.
    const onDeleteClick = () => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        deleteJob.mutate(jobData);
        void navigate('/jobs');
    };

    return (
        <>
        <section>
        <div className="container m-auto py-6 px-6">
            <Link
            to="/jobs"
            className="text-indigo-500 hover:text-indigo-600 flex items-center"
            >
            <FaArrowLeft className='mr-2'/> Back to Job Listings
            </Link>
        </div>
        </section>

        <section className="bg-indigo-50">
        <div className="container m-auto py-10 px-6">
            <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] w-full gap-6">
            <main>
                <div
                className="bg-white p-6 rounded-lg shadow-md text-center md:text-left"
                >
                <div className="text-gray-500 mb-4">{JOB_TYPE_LABELS[jobData.type]} · {REMOTE_TYPE_LABELS[jobData.remote]}</div>
                <h1 className="text-3xl font-bold mb-4">
                    {jobData.title}
                </h1>
                <div
                    className="text-gray-500 mb-4 flex align-middle justify-center md:justify-start"
                >
                    <FaMapMarker className="text-orange-700 mr-2"/>
                    <p className="text-orange-700">{jobData.location}</p>
                </div>
                <p className="text-gray-500 text-sm">
                    Posted{' '}
                    <time dateTime={jobData.postedAt} title={new Date(jobData.postedAt).toLocaleString()}>
                        {formatRelativeTime(jobData.postedAt)}
                    </time>
                </p>
                {jobData.tags.length > 0 && (
                    <ul className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start" aria-label="Tags">
                        {jobData.tags.map((tag) => (
                            <li key={tag} className="bg-indigo-100 text-indigo-800 text-sm rounded-full px-3 py-1">
                                {tag}
                            </li>
                        ))}
                    </ul>
                )}
                {jobData.externalUrl && (
                    <a
                        href={jobData.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-full"
                    >
                        Apply <FaExternalLinkAlt aria-hidden className="text-sm" />
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h3 className="text-indigo-800 text-lg font-bold mb-6">
                    Job Description
                </h3>

                <p className="mb-4 whitespace-pre-line">
                    {jobData.description}
                </p>

                <h3 className="text-indigo-800 text-lg font-bold mb-2">Salary</h3>

                <p className="mb-4">{formatSalaryRange(jobData)}</p>
                </div>
            </main>

            {/* <!-- Sidebar --> */}
            <aside>
                {/* <!-- Company Info --> */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-6">Company Info</h3>

                <h2 className="text-2xl">{jobData.company.name}</h2>

                <p className="my-2">
                   {jobData.company.description}
                </p>

                <hr className="my-4" />

                <h3 className="text-xl">Contact Email:</h3>

                <p className="my-2 bg-indigo-100 p-2 font-bold break-words">
                    {jobData.company.contactEmail ?? 'Not provided'}
                </p>

                <h3 className="text-xl">Contact Phone:</h3>

                <p className="my-2 bg-indigo-100 p-2 font-bold">{jobData.company.contactPhone ?? 'Not provided'}</p>
                </div>

                {/* <!-- Manage: only for the employer who posted the job --> */}
                {canManage && (
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h3 className="text-xl font-bold mb-6">Manage Job</h3>
                <Link
                    to={`/edit-job/${jobData.id}`}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-center font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block"
                    >Edit Job</Link>
                <button
                    onClick={onDeleteClick}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block"
                >
                    Delete Job
                </button>
                </div>
                )}
            </aside>
            </div>
        </div>
        </section>
        </>
    );
}

export default JobPage;

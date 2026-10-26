import { useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMapMarker } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const JobPage = () => {
    const jobData = useLoaderData();
    const navigate = useNavigate();
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const onDeleteClick = async () => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;

        setDeleting(true);
        setDeleteError("");
        try {
            const res = await fetch(`/api/jobs/${jobData.id}`, { method: 'DELETE' });
            if (!res.ok) {
                throw new Error(`Request failed with status ${res.status}`);
            }
            navigate('/jobs');
        } catch (err) {
            console.error('Error deleting job', err);
            setDeleteError('Could not delete the job. Please try again.');
            setDeleting(false);
        }
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
                <div className="text-gray-500 mb-4">{jobData.type}</div>
                <h1 className="text-3xl font-bold mb-4">
                    {jobData.title}
                </h1>
                <div
                    className="text-gray-500 mb-4 flex align-middle justify-center md:justify-start"
                >
                    <FaMapMarker className="text-orange-700 mr-2"/>
                    <p className="text-orange-700">{jobData.location}</p>
                </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h3 className="text-indigo-800 text-lg font-bold mb-6">
                    Job Description
                </h3>

                <p className="mb-4">
                    {jobData.description}
                </p>

                <h3 className="text-indigo-800 text-lg font-bold mb-2">Salary</h3>

                <p className="mb-4">{jobData.salary} / Year</p>
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

                <p className="my-2 bg-indigo-100 p-2 font-bold">
                    {jobData.company.contactEmail}
                </p>

                <h3 className="text-xl">Contact Phone:</h3>

                <p className="my-2 bg-indigo-100 p-2 font-bold">{jobData.company.contactPhone}</p>
                </div>

                {/* <!-- Manage --> */}
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h3 className="text-xl font-bold mb-6">Manage Job</h3>
                <Link
                    to={`/edit-job/${jobData.id}`}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-center font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block"
                    >Edit Job</Link>
                <button
                    onClick={onDeleteClick}
                    disabled={deleting}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {deleting ? 'Deleting Job...' : 'Delete Job'}
                </button>
                {deleteError && (
                    <p className="text-red-600 mt-4" role="alert">{deleteError}</p>
                )}
                </div>
            </aside>
            </div>
        </div>
        </section>
        </>
    );
}

// Data loader function to fetch job data
const JobLoader = async({params}) => {
    const res = await fetch('/api/jobs/' + params.id);
    if (res.status === 404) {
        throw new Response('Job not found', { status: 404, statusText: 'Not Found' });
    }
    if (!res.ok) {
        throw new Response('Failed to load job', { status: res.status, statusText: res.statusText });
    }
    const data = await res.json();
    return data;
};

export {JobPage as default, JobLoader};

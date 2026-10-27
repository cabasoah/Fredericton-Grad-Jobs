import { useState } from "react"
import {FaMapMarker} from "react-icons/fa"
import { Link } from "react-router-dom";
import { JOB_TYPE_LABELS, REMOTE_TYPE_LABELS, type Job } from "@fredericton-grad-jobs/shared";
import { truncateDescription } from "@/lib/truncateDescription";
import { formatSalary } from "@/lib/formatSalary";
import { descriptionText } from "@/lib/description";
import SaveJobButton from "./SaveJobButton";

type JobListingProps = {
    job: Job;
};

// Expanded cards stop here; the job page shows the full description.
const EXPANDED_LENGTH = 500;

const JobListing = ({job}: JobListingProps) => {
    const [showFullDescription, setShowFullDescription] = useState(false);
    // Imported jobs have HTML descriptions; cards show plain text.
    const text = descriptionText(job);
    const preview = truncateDescription(text);
    const isLong = preview.truncated;
    const description = showFullDescription ? truncateDescription(text, EXPANDED_LENGTH).text : preview.text;
  return (
     <div className="bg-white rounded-xl shadow-md relative">
                    <div className="p-4">
                        <div className="mb-6">
                        <div className="text-gray-600 my-2">{JOB_TYPE_LABELS[job.type]} · {REMOTE_TYPE_LABELS[job.remote]}</div>
                        <h3 className="text-xl font-bold">{job.title}</h3>
                        </div>

                        <div className="mb-5">
                            {description}
                        </div>
                        {isLong && (
                            <button onClick={() => setShowFullDescription((prevState) => !prevState)} className="text-indigo-500 mb-5 hover:text-indigo-600">
                                {showFullDescription ? "Less" : "More"}
                            </button>
                        )}

                        <h3 className="text-indigo-500 mb-2">{formatSalary(job)}</h3>

                        <div className="border border-gray-100 mb-5"></div>

                        <div className="flex flex-col lg:flex-row justify-between mb-4">
                        <div className="text-orange-700 mb-3">
                            <FaMapMarker className="inline mr-2 text-sm mb-1"/>
                                {job.location}
                        </div>
                        <div className="flex gap-2">
                        <SaveJobButton jobId={job.id} jobTitle={job.title} className="h-[36px]" />
                        <Link
                            to={`/jobs/${job.id}`}
                            className="h-[36px] bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-center text-sm"
                        >
                        Read More
                        </Link>
                        </div>
                        </div>
                    </div>
                </div>
  )
}

export default JobListing
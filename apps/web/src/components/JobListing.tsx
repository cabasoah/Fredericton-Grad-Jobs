import { useState } from "react"
import {FaMapMarker} from "react-icons/fa"
import { Link } from "react-router-dom";
import type { Job } from "@react-dev/shared";

type JobListingProps = {
    job: Job;
};

const JobListing = ({job}: JobListingProps) => {
    const [showFullDescription, setShowFullDescription] = useState(false);
    let description = job.description;
    const isLong = description.length > 90;

    if(isLong && !showFullDescription){
        description = description.substring(0,90) + '...';
    }
  return (
     <div className="bg-white rounded-xl shadow-md relative">
                    <div className="p-4">
                        <div className="mb-6">
                        <div className="text-gray-600 my-2">{job.type}</div>
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

                        <h3 className="text-indigo-500 mb-2">{job.salary} / Year</h3>

                        <div className="border border-gray-100 mb-5"></div>

                        <div className="flex flex-col lg:flex-row justify-between mb-4">
                        <div className="text-orange-700 mb-3">
                            <FaMapMarker className="inline mr-2 text-sm mb-1"/>
                                {job.location}
                        </div>
                        <Link
                            to={`/jobs/${job.id}`} 
                            className="h-[36px] bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-center text-sm"
                        >
                        Read More
                        </Link>
                        </div>
                    </div>
                </div>
  )
}

export default JobListing
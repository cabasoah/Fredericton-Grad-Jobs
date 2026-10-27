import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { useAuth } from "@/auth/AuthContext";
import { useApplications, useCreateApplication } from "@/lib/queries/applications";

type SaveJobButtonProps = {
  jobId: string;
  jobTitle: string;
  className?: string;
};

// "Save" adds the job to a job seeker's tracker as SAVED. Signed-out
// visitors are sent to log in and back; employers do not see it.
const SaveJobButton = ({ jobId, jobTitle, className = "" }: SaveJobButtonProps) => {
  const { status, user } = useAuth();
  const isSeeker = user?.role === "SEEKER";
  const { data: applications } = useApplications(isSeeker);
  const createApplication = useCreateApplication();
  const navigate = useNavigate();
  const location = useLocation();

  if (status === "loading" || user?.role === "EMPLOYER") return null;

  const base = `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${className}`;
  const saved = applications?.find((application) => application.jobId === jobId);

  if (saved) {
    return (
      <Link to="/tracker" className={`${base} bg-green-100 text-green-800 hover:bg-green-200`}>
        <FaBookmark aria-hidden /> Saved
        <span className="sr-only"> {jobTitle} (open your tracker)</span>
      </Link>
    );
  }

  const onClick = () => {
    if (!user) {
      void navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    createApplication.mutate({ jobId });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={createApplication.isPending || (isSeeker && !applications)}
      className={`${base} border border-indigo-500 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50`}
    >
      <FaRegBookmark aria-hidden /> {createApplication.isPending ? "Saving..." : "Save"}
      <span className="sr-only"> {jobTitle} to your tracker</span>
    </button>
  );
};

export default SaveJobButton;

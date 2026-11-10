import { Link, useLocation, useNavigate } from "react-router-dom";
import { LuBookmark, LuBookmarkCheck } from "react-icons/lu";
import { useAuth } from "@/auth/AuthContext";
import { useApplications, useCreateApplication } from "@/lib/queries/applications";
import { buttonSecondary, buttonSuccess } from "@/lib/styles";

type SaveJobButtonProps = {
  jobId: string;
  jobTitle: string;
  // "icon": a square bookmark button for job cards; "button": with a label.
  variant?: "icon" | "button";
  className?: string;
};

// "Save" adds the job to a job seeker's tracker as SAVED. Signed-out
// visitors are sent to log in and back; employers do not see it.
const SaveJobButton = ({ jobId, jobTitle, variant = "button", className = "" }: SaveJobButtonProps) => {
  const { status, user } = useAuth();
  const isSeeker = user?.role === "SEEKER";
  const { data: applications } = useApplications(isSeeker);
  const createApplication = useCreateApplication();
  const navigate = useNavigate();
  const location = useLocation();

  if (status === "loading" || user?.role === "EMPLOYER") return null;

  const isIcon = variant === "icon";
  const iconBase =
    "relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50";
  const saved = applications?.find((application) => application.jobId === jobId);

  if (saved) {
    return (
      <Link
        to="/tracker"
        aria-label={`Saved ${jobTitle} (open your tracker)`}
        className={`${
          isIcon
            ? `${iconBase} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100`
            : buttonSuccess
        } ${className}`}
      >
        <LuBookmarkCheck aria-hidden className={isIcon ? "text-lg" : ""} />
        {!isIcon && "Saved"}
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
      aria-label={`Save ${jobTitle} to your tracker`}
      title={isIcon ? "Save to tracker" : undefined}
      className={`${
        isIcon ? `${iconBase} border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600` : buttonSecondary
      } ${className}`}
    >
      <LuBookmark aria-hidden className={isIcon ? "text-lg" : ""} />
      {!isIcon && (createApplication.isPending ? "Saving..." : "Save")}
    </button>
  );
};

export default SaveJobButton;

import { Link } from "react-router-dom";
import { pageContainer } from "@/lib/styles";

const Footer = () => (
  <footer className="mt-16 border-t border-slate-200 bg-white">
    <div className={`${pageContainer} flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between`}>
      <div className="max-w-sm">
        <p className="font-semibold text-slate-900">Fredericton Grad Jobs</p>
        <p className="mt-1 text-sm text-slate-500">
          Graduate jobs, entry-level and junior roles in Fredericton and Atlantic Canada, with a tracker for every
          application.
        </p>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
        <Link to="/jobs" className="hover:text-slate-900">Browse jobs</Link>
        <Link to="/tracker" className="hover:text-slate-900">Application tracker</Link>
        <Link to="/add-job" className="hover:text-slate-900">Post a job</Link>
      </nav>
    </div>
    <div className={`${pageContainer} border-t border-slate-100 py-6 text-xs text-slate-500`}>
      © {new Date().getFullYear()} Fredericton Grad Jobs. Imported postings come from public Greenhouse and Lever job boards.
    </div>
  </footer>
);

export default Footer;

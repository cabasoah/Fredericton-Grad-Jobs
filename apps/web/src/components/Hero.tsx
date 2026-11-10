import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LuMapPin, LuSearch } from "react-icons/lu";
import type { Stats } from "@fredericton-grad-jobs/shared";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { buttonPrimary, pageContainer } from "@/lib/styles";

const count = new Intl.NumberFormat("en-CA");

// Home page hero: headline and a search that opens the jobs page with the
// keyword and location filters filled in.
const Hero = ({ stats }: { stats?: Stats }) => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (location.trim()) params.set("location", location.trim());
    const search = params.toString();
    void navigate(search ? `/jobs?${search}` : "/jobs");
  };

  return (
    <section className="relative overflow-hidden">
      {/* Soft glow behind the headline. */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-100/50 to-transparent blur-3xl" />
      <div className={`${pageContainer} relative flex flex-col items-center pb-14 pt-14 text-center sm:pt-20`}>
        {stats && (
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
            <span aria-hidden>🎓</span>
            {count.format(stats.openJobs)} open roles
            {stats.lastSuccessfulIngestAt && <> · updated {formatRelativeTime(stats.lastSuccessfulIngestAt)}</>}
          </p>
        )}
        <h1 className="max-w-3xl text-[32px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.15]">
          Start your career close to home
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Graduate jobs, internships and co-op roles in Fredericton and Atlantic Canada, plus a tracker for every
          application you send.
        </p>

        <form
          role="search"
          aria-label="Search jobs"
          onSubmit={onSubmit}
          className="mt-8 flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-card-hover md:flex-row md:items-center"
        >
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500">
            <LuSearch aria-hidden className="shrink-0 text-slate-400" />
            <label htmlFor="hero-q" className="sr-only">Keywords</label>
            <input
              id="hero-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Job title, skill or company"
              className="h-11 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500">
            <LuMapPin aria-hidden className="shrink-0 text-slate-400" />
            <label htmlFor="hero-location" className="sr-only">Location</label>
            <input
              id="hero-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Fredericton, Moncton, Remote..."
              className="h-11 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <button type="submit" className={`${buttonPrimary} h-11 px-5`}>
            <LuSearch aria-hidden /> Search jobs
          </button>
        </form>
      </div>
    </section>
  );
};

export default Hero;

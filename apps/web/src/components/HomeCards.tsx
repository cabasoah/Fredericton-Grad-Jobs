import { Link } from "react-router-dom"
import { LuArrowRight, LuCircleCheck, LuCirclePlus } from "react-icons/lu"
import { buttonDark, buttonPrimary, card } from "@/lib/styles"

const Check = ({ children, tone }: { children: string; tone: "indigo" | "emerald" }) => (
  <li className="flex items-start gap-2 text-sm text-slate-600">
    <LuCircleCheck aria-hidden className={`mt-0.5 shrink-0 ${tone === "indigo" ? "text-indigo-500" : "text-emerald-600"}`} />
    {children}
  </li>
);

// One card for each kind of account, listing what the app does for them.
const HomeCards = () => {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className={`${card} relative overflow-hidden p-7`}>
        <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-100/60 blur-2xl" />
        <p className="relative inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
          Students &amp; new grads
        </p>
        <h2 className="relative mt-4 text-xl font-semibold tracking-tight text-slate-900">Launch your career without leaving home</h2>
        <p className="relative mt-2 text-sm leading-6 text-slate-600">
          Browse entry-level roles, save the ones you like with one click, and follow every application from saved to
          offer.
        </p>
        <ul className="relative mt-5 space-y-2.5">
          <Check tone="indigo">Search and filter by type, location, salary and skills</Check>
          <Check tone="indigo">Track applications on a drag-and-drop board</Check>
          <Check tone="indigo">See your response rate and weekly activity</Check>
        </ul>
        <Link to="/jobs" className={`${buttonPrimary} relative mt-7`}>
          Browse jobs <LuArrowRight aria-hidden />
        </Link>
      </div>

      <div className={`${card} relative overflow-hidden p-7`}>
        <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-100/70 blur-2xl" />
        <p className="relative inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
          Local employers
        </p>
        <h2 className="relative mt-4 text-xl font-semibold tracking-tight text-slate-900">Hire emerging talent from local schools</h2>
        <p className="relative mt-2 text-sm leading-6 text-slate-600">
          Create an employer account and post roles for your company. Graduates find them next to the region&apos;s
          other openings.
        </p>
        <ul className="relative mt-5 space-y-2.5">
          <Check tone="emerald">Post jobs for your own company in a few minutes</Check>
          <Check tone="emerald">Show salary, skills and an application link</Check>
          <Check tone="emerald">Edit or remove your postings at any time</Check>
        </ul>
        <Link to="/add-job" className={`${buttonDark} relative mt-7`}>
          Post a job <LuCirclePlus aria-hidden />
        </Link>
      </div>
    </div>
  )
}

export default HomeCards

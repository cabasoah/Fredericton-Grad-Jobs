import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LuArrowRight, LuHouse, LuSearch } from "react-icons/lu";
import { buttonPrimary, buttonSecondary, card } from "@/lib/styles";

type StatusCardProps = {
  icon: ReactNode;
  // Small pill above the heading, e.g. "Error 404".
  label: string;
  title: string;
  message: string;
};

// Centred card for "not found", "not allowed" and "something went wrong",
// with the same two ways out.
const StatusCard = ({ icon, label, title, message }: StatusCardProps) => (
  <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16">
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-100/60 blur-3xl" />
    <div className={`${card} relative w-full max-w-xl p-8 text-center sm:p-10`}>
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl text-indigo-600">
        {icon}
      </span>
      <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> {label}
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/jobs" className={buttonPrimary}>
          <LuSearch aria-hidden /> Back to jobs <LuArrowRight aria-hidden />
        </Link>
        <Link to="/" className={buttonSecondary}>
          <LuHouse aria-hidden /> Return home
        </Link>
      </div>
    </div>
  </section>
);

export default StatusCard;

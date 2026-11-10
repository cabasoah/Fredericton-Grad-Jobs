import type { ReactNode } from "react";
import { LuBriefcase } from "react-icons/lu";
import { card } from "@/lib/styles";

type AuthCardProps = {
  title: string;
  subtitle: string;
  width?: "md" | "lg";
  children: ReactNode;
  footer: ReactNode;
};

// Centred card for the log in and sign up pages.
const AuthCard = ({ title, subtitle, width = "md", children, footer }: AuthCardProps) => (
  <section className="flex justify-center px-4 py-12 sm:py-16">
    <div className={`w-full ${width === "md" ? "max-w-md" : "max-w-lg"}`}>
      <div className={`${card} p-7 sm:p-9`}>
        <span aria-hidden className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white shadow-sm">
          <LuBriefcase />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </div>
      <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>
    </div>
  </section>
);

export default AuthCard;

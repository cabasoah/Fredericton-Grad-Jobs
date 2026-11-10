// Shared Tailwind class strings for the "Calm Horizon" design system, so
// buttons, inputs and cards look the same on every page.

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonPrimary = `${buttonBase} h-10 px-4 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98]`;
export const buttonSecondary = `${buttonBase} h-10 px-4 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900`;
export const buttonSuccess = `${buttonBase} h-10 px-4 border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`;
export const buttonGhost = `${buttonBase} h-10 px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900`;
export const buttonDanger = `${buttonBase} h-10 px-4 border border-rose-200 bg-white text-rose-600 hover:bg-rose-50`;
export const buttonDark = `${buttonBase} h-10 px-4 bg-slate-900 text-white hover:bg-slate-800`;

export const inputClass =
  "block w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 aria-[invalid=true]:border-rose-400";
export const textareaClass = inputClass.replace("h-10", "py-2.5 leading-6");
export const selectClass = `${inputClass} pr-8`;
export const labelClass = "block text-[13px] font-medium text-slate-700 mb-1.5";
export const hintClass = "mt-1.5 text-xs text-slate-500";
export const errorTextClass = "mt-1.5 text-xs text-rose-600";

export const card = "rounded-2xl border border-slate-200 bg-white shadow-card";
export const cardInteractive = `${card} transition hover:border-slate-300 hover:shadow-card-hover`;

export const eyebrow = "text-xs font-semibold uppercase tracking-wider text-indigo-600";
export const pageContainer = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

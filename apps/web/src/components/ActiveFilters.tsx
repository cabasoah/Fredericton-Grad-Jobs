import { useSearchParams } from "react-router-dom";
import { LuX } from "react-icons/lu";
import { JOB_TYPE_LABELS, REMOTE_TYPE_LABELS } from "@fredericton-grad-jobs/shared";
import { filtersFromSearchParams } from "@/lib/jobFilters";
import { useSearchParamsUpdater } from "@/lib/useSearchParamsUpdater";

const money = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", notation: "compact", maximumFractionDigits: 1 });

// The filters in the URL as removable chips, above the results.
const ActiveFilters = ({ onClearAll }: { onClearAll: () => void }) => {
  const [searchParams] = useSearchParams();
  const updateSearchParams = useSearchParamsUpdater();
  const filters = filtersFromSearchParams(searchParams);

  const chips: { key: string; label: string }[] = [];
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”` });
  if (filters.type) chips.push({ key: "type", label: JOB_TYPE_LABELS[filters.type] });
  if (filters.remote) chips.push({ key: "remote", label: REMOTE_TYPE_LABELS[filters.remote] });
  if (filters.location) chips.push({ key: "location", label: filters.location });
  if (filters.salaryMin !== undefined) chips.push({ key: "salaryMin", label: `Min. ${money.format(filters.salaryMin)}` });
  if (filters.tags) chips.push({ key: "tags", label: `Tags: ${filters.tags.join(", ")}` });
  if (chips.length === 0) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active</span>
      <ul className="contents">
        {chips.map((chip) => (
          <li key={chip.key}>
            <button
              type="button"
              onClick={() => updateSearchParams((next) => next.delete(chip.key))}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label} <LuX aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClearAll} className="ml-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
        Clear all
      </button>
    </div>
  );
};

export default ActiveFilters;

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuMapPin, LuSearch, LuSlidersHorizontal } from "react-icons/lu";
import {
  JOB_SORTS,
  JOB_TYPE_LABELS,
  JOB_TYPES,
  REMOTE_TYPE_LABELS,
  REMOTE_TYPES,
} from "@fredericton-grad-jobs/shared";
import { filtersFromSearchParams, TEXT_FILTER_KEYS, type TextFilterKey } from "@/lib/jobFilters";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useSearchParamsUpdater } from "@/lib/useSearchParamsUpdater";
import { card, inputClass, labelClass, selectClass } from "@/lib/styles";

export const SEARCH_DEBOUNCE_MS = 300;

const SORT_LABELS: Record<(typeof JOB_SORTS)[number], string> = {
  newest: "Newest first",
  salary_desc: "Highest salary",
  salary_asc: "Lowest salary",
};

type TextDrafts = Record<TextFilterKey, string>;

const draftsFromUrl = (params: URLSearchParams): TextDrafts => ({
  q: params.get("q") ?? "",
  location: params.get("location") ?? "",
  salaryMin: params.get("salaryMin") ?? "",
  tags: params.get("tags") ?? "",
});

const sameDrafts = (a: TextDrafts, b: TextDrafts) =>
  TEXT_FILTER_KEYS.every((key) => a[key].trim() === b[key].trim());

// Search and filter controls for the jobs page (the sort order is
// SortSelect, shown above the results). All values live in the URL
// (?q=...&type=...), so a filtered view can be shared, bookmarked and
// survives a refresh. Text inputs update the URL 300 ms after typing stops;
// selects update it immediately.
const JobFiltersBar = ({ onReset }: { onReset?: () => void }) => {
  const [searchParams] = useSearchParams();
  const updateSearchParams = useSearchParamsUpdater();
  const [drafts, setDrafts] = useState<TextDrafts>(() => draftsFromUrl(searchParams));
  const debouncedDrafts = useDebouncedValue(drafts, SEARCH_DEBOUNCE_MS);
  const filters = filtersFromSearchParams(searchParams);

  // Typing -> URL (debounced). Replaces the history entry so Back does not
  // step through every keystroke. Only once the debounce has caught up with
  // the inputs: right after the URL changes elsewhere (Clear filters, Back),
  // the debounced value is stale and would put the old text back.
  useEffect(() => {
    if (!sameDrafts(debouncedDrafts, drafts)) return;
    updateSearchParams(
      (next) => {
        for (const key of TEXT_FILTER_KEYS) {
          const value = debouncedDrafts[key].trim();
          if (value) next.set(key, value);
          else next.delete(key);
        }
      },
      { replace: true },
    );
  }, [debouncedDrafts, drafts, updateSearchParams]);

  // URL -> inputs, when the URL changes from elsewhere (Back/Forward, a
  // shared link, Clear filters) rather than from typing.
  const urlDrafts = draftsFromUrl(searchParams);
  const [lastUrlDrafts, setLastUrlDrafts] = useState(urlDrafts);
  if (!sameDrafts(urlDrafts, lastUrlDrafts)) {
    setLastUrlDrafts(urlDrafts);
    if (!sameDrafts(urlDrafts, debouncedDrafts)) setDrafts(urlDrafts);
  }

  const setDraft = (key: TextFilterKey, value: string) =>
    setDrafts((current) => ({ ...current, [key]: value }));

  const setSelect = (key: "type" | "remote", value: string) =>
    updateSearchParams((next) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });

  const iconInput = `${inputClass} pl-9`;

  return (
    <form
      role="search"
      aria-label="Filter jobs"
      className={`${card} p-5`}
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <LuSlidersHorizontal aria-hidden className="text-slate-500" /> Refine search
        </h2>
        {onReset && (
          <button type="button" onClick={onReset} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            Reset all
          </button>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="job-search" className={labelClass}>Search jobs</label>
          <div className="relative">
            <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="job-search"
              type="search"
              className={iconInput}
              placeholder="Title, description or company"
              value={drafts.q}
              onChange={(e) => setDraft("q", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filter-location" className={labelClass}>Location</label>
          <div className="relative">
            <LuMapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input id="filter-location" type="text" className={iconInput} placeholder="eg. Fredericton"
              value={drafts.location} onChange={(e) => setDraft("location", e.target.value)} />
          </div>
        </div>

        <div>
          <label htmlFor="filter-type" className={labelClass}>Job type</label>
          <select id="filter-type" className={selectClass} value={filters.type ?? ""} onChange={(e) => setSelect("type", e.target.value)}>
            <option value="">Any</option>
            {JOB_TYPES.map((type) => <option key={type} value={type}>{JOB_TYPE_LABELS[type]}</option>)}
          </select>
        </div>

        <fieldset>
          <legend className={labelClass}>Work arrangement</legend>
          <div className="grid grid-cols-2 gap-1.5">
            {(["", ...REMOTE_TYPES] as const).map((remote) => (
              <label key={remote || "ANY"} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="remote"
                  value={remote}
                  checked={(filters.remote ?? "") === remote}
                  onChange={() => setSelect("remote", remote)}
                  className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 transition-colors hover:bg-slate-100 peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-1">
                  {remote ? REMOTE_TYPE_LABELS[remote] : "Any"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="filter-salary" className={labelClass}>Minimum salary</label>
          <input id="filter-salary" type="number" min={0} step={1} inputMode="numeric" className={inputClass} placeholder="eg. 60000"
            value={drafts.salaryMin} onChange={(e) => setDraft("salaryMin", e.target.value)} />
        </div>

        <div>
          <label htmlFor="filter-tags" className={labelClass}>Tags</label>
          <input id="filter-tags" type="text" className={inputClass} placeholder="eg. react, typescript"
            value={drafts.tags} onChange={(e) => setDraft("tags", e.target.value)} />
          <p className="mt-1.5 text-xs text-slate-500">Jobs with every tag listed.</p>
        </div>
      </div>
    </form>
  );
};

// Sort order, shown above the results. Lives in the URL like the filters.
export const SortSelect = () => {
  const [searchParams] = useSearchParams();
  const updateSearchParams = useSearchParamsUpdater();
  const sort = filtersFromSearchParams(searchParams).sort ?? "newest";
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="filter-sort" className="shrink-0 text-xs font-medium text-slate-500">Sort by</label>
      <select
        id="filter-sort"
        className={`${selectClass} h-9 w-44 bg-white`}
        value={sort}
        onChange={(e) =>
          updateSearchParams((next) => {
            if (e.target.value === "newest") next.delete("sort");
            else next.set("sort", e.target.value);
          })
        }
      >
        {JOB_SORTS.map((option) => <option key={option} value={option}>{SORT_LABELS[option]}</option>)}
      </select>
    </div>
  );
};

export default JobFiltersBar;

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
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

const inputClass = "border rounded w-full py-2 px-3 bg-white";
const labelClass = "block text-gray-700 text-sm font-bold mb-1";

// Search and filter controls for the jobs page. All values live in the URL
// (?q=...&type=...), so a filtered view can be shared, bookmarked and
// survives a refresh. Text inputs update the URL 300 ms after typing stops;
// selects update it immediately.
const JobFiltersBar = () => {
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

  const setSelect = (key: "type" | "remote" | "sort", value: string) =>
    updateSearchParams((next) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });

  return (
    <form
      role="search"
      className="container-xl lg:container m-auto px-4 pt-8"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="relative mb-4">
        <label htmlFor="job-search" className="sr-only">Search jobs</label>
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
        <input
          id="job-search"
          type="search"
          className={`${inputClass} pl-10`}
          placeholder="Search titles, descriptions and companies"
          value={drafts.q}
          onChange={(e) => setDraft("q", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div>
          <label htmlFor="filter-type" className={labelClass}>Job type</label>
          <select id="filter-type" className={inputClass} value={filters.type ?? ""} onChange={(e) => setSelect("type", e.target.value)}>
            <option value="">Any</option>
            {JOB_TYPES.map((type) => <option key={type} value={type}>{JOB_TYPE_LABELS[type]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-remote" className={labelClass}>Work arrangement</label>
          <select id="filter-remote" className={inputClass} value={filters.remote ?? ""} onChange={(e) => setSelect("remote", e.target.value)}>
            <option value="">Any</option>
            {REMOTE_TYPES.map((remote) => <option key={remote} value={remote}>{REMOTE_TYPE_LABELS[remote]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-location" className={labelClass}>Location</label>
          <input id="filter-location" type="text" className={inputClass} placeholder="eg. Fredericton"
            value={drafts.location} onChange={(e) => setDraft("location", e.target.value)} />
        </div>
        <div>
          <label htmlFor="filter-salary" className={labelClass}>Minimum salary</label>
          <input id="filter-salary" type="number" min={0} step={1} inputMode="numeric" className={inputClass} placeholder="eg. 60000"
            value={drafts.salaryMin} onChange={(e) => setDraft("salaryMin", e.target.value)} />
        </div>
        <div>
          <label htmlFor="filter-tags" className={labelClass}>Tags</label>
          <input id="filter-tags" type="text" className={inputClass} placeholder="eg. react, typescript"
            value={drafts.tags} onChange={(e) => setDraft("tags", e.target.value)} />
        </div>
        <div>
          <label htmlFor="filter-sort" className={labelClass}>Sort by</label>
          <select id="filter-sort" className={inputClass} value={filters.sort ?? "newest"}
            onChange={(e) => setSelect("sort", e.target.value === "newest" ? "" : e.target.value)}>
            {JOB_SORTS.map((sort) => <option key={sort} value={sort}>{SORT_LABELS[sort]}</option>)}
          </select>
        </div>
      </div>
    </form>
  );
};

export default JobFiltersBar;

import type { IngestSourceName } from "./types";

export type IngestTarget = {
  source: IngestSourceName;
  // Greenhouse board token or Lever company slug (from the board's URL).
  company: string;
  // Company name shown on job listings.
  name: string;
};

// Companies to pull jobs from. Edit freely: each entry is one request per
// run. Find a token in the company's careers URL, e.g.
// boards.greenhouse.io/<token> or jobs.lever.co/<slug>.
//
// All entries returned HTTP 200 when checked on 2026-10-26. Some boards had
// no open postings that day; they are kept so new postings show up.
export const INGEST_TARGETS: IngestTarget[] = [
  // Greenhouse
  { source: "GREENHOUSE", company: "hootsuite", name: "Hootsuite" }, // Vancouver
  { source: "GREENHOUSE", company: "d2l", name: "D2L" }, // Kitchener-Waterloo
  { source: "GREENHOUSE", company: "faire", name: "Faire" }, // Kitchener-Waterloo and Toronto offices
  { source: "GREENHOUSE", company: "thinkific", name: "Thinkific" }, // Vancouver (0 postings on 2026-10-26)
  { source: "GREENHOUSE", company: "gitlab", name: "GitLab" }, // all-remote
  { source: "GREENHOUSE", company: "coinbase", name: "Coinbase" }, // remote-first
  { source: "GREENHOUSE", company: "figma", name: "Figma" }, // includes remote roles
  // Lever
  { source: "LEVER", company: "fullscript", name: "Fullscript" }, // Ottawa
  { source: "LEVER", company: "wealthsimple", name: "Wealthsimple" }, // Toronto (0 postings on 2026-10-26)
  { source: "LEVER", company: "plusgrade", name: "Plusgrade" }, // Montreal (0 postings on 2026-10-26)
  { source: "LEVER", company: "spotify", name: "Spotify" }, // includes remote roles
];

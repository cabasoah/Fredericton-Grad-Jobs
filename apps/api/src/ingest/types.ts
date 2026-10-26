import type { JobType, RemoteType } from "@fredericton-grad-jobs/shared";
import type { HttpOptions } from "./http";

export type IngestSourceName = "GREENHOUSE" | "LEVER";

// A posting mapped to our Job fields. Salary is not included: neither
// source provided salary data in the responses this was built from.
export type NormalizedJob = {
  externalId: string;
  title: string;
  description: string;
  location: string;
  remote: RemoteType;
  type: JobType;
  externalUrl: string;
  postedAt: Date;
};

export type Source = {
  name: IngestSourceName;
  // Raw postings for one company, as returned by the source.
  fetchJobs: (company: string, http: HttpOptions) => Promise<unknown[]>;
  // The posting's id, if it has one, even when normalize() would fail; used
  // so that postings we cannot map are not marked CLOSED.
  rawId: (raw: unknown) => string | undefined;
  // Throws (ZodError) if the posting does not have the expected shape.
  normalize: (raw: unknown) => NormalizedJob;
};

// Limits matching what the web app expects to display.
export const MAX_TITLE_LENGTH = 200;
export const MAX_LOCATION_LENGTH = 200;
export const EMPTY_DESCRIPTION = "<p>See the full posting for details.</p>";

export const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

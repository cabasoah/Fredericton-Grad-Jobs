import { z } from "zod";
import { fetchJson, type HttpOptions } from "../http";
import { inferJobType, inferRemote } from "../infer";
import { sanitizeDescription } from "../sanitize";
import {
  clip,
  EMPTY_DESCRIPTION,
  MAX_LOCATION_LENGTH,
  MAX_TITLE_LENGTH,
  type NormalizedJob,
  type Source,
} from "../types";

// Fields we use from https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
// (checked against real responses; other fields are ignored).
const GreenhouseJobSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  absolute_url: z.url(),
  location: z.object({ name: z.string() }).nullish(),
  // Entity-escaped HTML: "&lt;p&gt;..."
  content: z.string().nullish(),
  first_published: z.string().nullish(),
  updated_at: z.string(),
  metadata: z.array(z.object({ name: z.string(), value: z.unknown() })).nullish(),
});

const GreenhouseBoardSchema = z.object({ jobs: z.array(z.unknown()) });

// Some boards set a custom "Employment Type" field ("Full-time", "Regular",
// "Intern", "Temporary"); most do not.
const employmentType = (metadata: z.infer<typeof GreenhouseJobSchema>["metadata"]) => {
  const value = metadata?.find((field) => field.name.toLowerCase() === "employment type")?.value;
  return typeof value === "string" ? value : undefined;
};

export const normalizeGreenhouseJob = (raw: unknown): NormalizedJob => {
  const job = GreenhouseJobSchema.parse(raw);
  const location = job.location?.name.trim() || "Not specified";
  const description = job.content ? sanitizeDescription(job.content, { entityEncoded: true }) : "";
  return {
    externalId: String(job.id),
    title: clip(job.title.trim(), MAX_TITLE_LENGTH),
    description: description || EMPTY_DESCRIPTION,
    location: clip(location, MAX_LOCATION_LENGTH),
    remote: inferRemote(location),
    type: inferJobType(employmentType(job.metadata), job.title),
    externalUrl: job.absolute_url,
    postedAt: new Date(job.first_published ?? job.updated_at),
  };
};

export const greenhouse: Source = {
  name: "GREENHOUSE",
  fetchJobs: async (boardToken: string, http: HttpOptions) => {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
    return GreenhouseBoardSchema.parse(await fetchJson(url, http)).jobs;
  },
  rawId: (raw) => {
    const id = z.object({ id: z.number() }).safeParse(raw);
    return id.success ? String(id.data.id) : undefined;
  },
  normalize: normalizeGreenhouseJob,
};

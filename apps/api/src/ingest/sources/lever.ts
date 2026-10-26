import { z } from "zod";
import { escapeText } from "entities";
import type { RemoteType } from "@fredericton-grad-jobs/shared";
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

// Fields we use from https://api.lever.co/v0/postings/{company}?mode=json
// (checked against real responses; other fields are ignored).
const LeverPostingSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  hostedUrl: z.url(),
  // Milliseconds since the epoch.
  createdAt: z.number(),
  // "hybrid" | "onsite" | "remote" in the responses seen; may be absent.
  workplaceType: z.string().nullish(),
  categories: z
    .object({
      commitment: z.string().nullish(),
      location: z.string().nullish(),
      allLocations: z.array(z.string()).nullish(),
    })
    .nullish(),
  // HTML. "lists" are titled sections whose content is a run of <li> items.
  description: z.string().nullish(),
  lists: z.array(z.object({ text: z.string(), content: z.string() })).nullish(),
  additional: z.string().nullish(),
});

const LeverResponseSchema = z.array(z.unknown());

const WORKPLACE_TYPES: Record<string, RemoteType> = {
  remote: "REMOTE",
  hybrid: "HYBRID",
  onsite: "ONSITE",
};

export const normalizeLeverPosting = (raw: unknown): NormalizedJob => {
  const posting = LeverPostingSchema.parse(raw);
  const location =
    posting.categories?.location?.trim() || posting.categories?.allLocations?.[0]?.trim() || "Not specified";
  const html = [
    posting.description ?? "",
    ...(posting.lists ?? []).map((list) => `<h3>${escapeText(list.text)}</h3><ul>${list.content}</ul>`),
    posting.additional ?? "",
  ].join("\n");
  const description = sanitizeDescription(html);
  return {
    externalId: posting.id,
    title: clip(posting.text.trim(), MAX_TITLE_LENGTH),
    description: description || EMPTY_DESCRIPTION,
    location: clip(location, MAX_LOCATION_LENGTH),
    // Lever states the arrangement; fall back to the location text.
    remote: WORKPLACE_TYPES[posting.workplaceType?.toLowerCase() ?? ""] ?? inferRemote(location),
    type: inferJobType(posting.categories?.commitment, posting.text),
    externalUrl: posting.hostedUrl,
    postedAt: new Date(posting.createdAt),
  };
};

export const lever: Source = {
  name: "LEVER",
  fetchJobs: async (company: string, http: HttpOptions) => {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`;
    return LeverResponseSchema.parse(await fetchJson(url, http));
  },
  rawId: (raw) => {
    const id = z.object({ id: z.string().min(1) }).safeParse(raw);
    return id.success ? id.data.id : undefined;
  },
  normalize: normalizeLeverPosting,
};

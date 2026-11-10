import type { NormalizedJob } from "./types";

// The board is for graduates in Atlantic Canada, so imported postings are
// kept only when they are located there, or remote and open to Canada.
//
// Province names, a province code after a comma ("Moncton, NB"), and city
// names that only exist in the region. Cities that share a name with places
// elsewhere (Halifax, Sydney) are matched through their province instead.
const ATLANTIC =
  /\b(new brunswick|nova scotia|prince edward island|newfoundland|labrador|atlantic canada|fredericton|moncton|charlottetown|st\.? john's)\b|,\s*(NB|NS|PE|PEI|NL)\b/i;

const CANADA = /\bcanada\b/i;

export const isAtlanticCanada = (location: string) => ATLANTIC.test(location);

// "Remote - Canada", "Remote, Canada; Remote, United States": remote roles
// that can be done from anywhere in Canada.
export const isRemoteInCanada = ({ location, remote }: Pick<NormalizedJob, "location" | "remote">) =>
  remote === "REMOTE" && CANADA.test(location);

export const isInRegion = (job: Pick<NormalizedJob, "location" | "remote">) =>
  isAtlanticCanada(job.location) || isRemoteInCanada(job);

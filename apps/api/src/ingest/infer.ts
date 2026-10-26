import type { JobType, RemoteType } from "@fredericton-grad-jobs/shared";

// "Remote - USA", "Remote, Canada; Remote, United States" -> REMOTE;
// "Hybrid - New York, NY" -> HYBRID; anything else -> ONSITE.
export const inferRemote = (text: string): RemoteType => {
  if (/\bremote\b/i.test(text)) return "REMOTE";
  if (/\bhybrid\b/i.test(text)) return "HYBRID";
  return "ONSITE";
};

// Maps an employment-type label from a source ("Full-time", "Permanent",
// "Regular", "Internship", "Short Term", ...) to our JobType, or undefined
// when the label is missing or unknown.
export const typeFromLabel = (label: string | null | undefined): JobType | undefined => {
  if (!label) return undefined;
  if (/\b(intern|internship|co-?op|scholarship)\b/i.test(label)) return "INTERNSHIP";
  if (/\bpart[\s-]?time\b/i.test(label)) return "PART_TIME";
  if (/\b(contract|contractor|temporary|temp|fixed[\s-]?term|short[\s-]?term|seasonal)\b/i.test(label)) {
    return "CONTRACT";
  }
  if (/\b(full[\s-]?time|permanent|regular)\b/i.test(label)) return "FULL_TIME";
  return undefined;
};

// Titles only reliably signal internships ("Software Engineering Intern");
// words like "Contract" often describe the work ("Contract Manager").
export const typeFromTitle = (title: string): JobType | undefined =>
  /\b(intern|internship|co-?op)\b/i.test(title) ? "INTERNSHIP" : undefined;

// Explicit label first, then the title, then FULL_TIME (most postings on
// these boards are full-time and many do not state a type).
export const inferJobType = (label: string | null | undefined, title: string): JobType =>
  typeFromLabel(label) ?? typeFromTitle(title) ?? "FULL_TIME";

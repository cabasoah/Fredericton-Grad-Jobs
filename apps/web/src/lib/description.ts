import DOMPurify from "dompurify";
import type { Job } from "@fredericton-grad-jobs/shared";

// Imported jobs (Greenhouse, Lever) have HTML descriptions, already
// sanitized by the API. They are sanitized again here with the same
// allowlist before rendering, so the browser never trusts stored HTML.
// Jobs posted through the form are plain text.
export const isHtmlDescription = (job: Pick<Job, "source">) => job.source !== "MANUAL";

const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h2", "h3", "h4", "a", "blockquote"];

export const safeDescriptionHtml = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ["href", "target", "rel"] });

// Plain text for previews such as the job cards.
export const descriptionText = (job: Pick<Job, "source" | "description">) => {
  if (!isHtmlDescription(job)) return job.description;
  const doc = new DOMParser().parseFromString(safeDescriptionHtml(job.description), "text/html");
  // textContent joins blocks directly ("Requirements" + "Python"), so keep
  // paragraphs, items and line breaks apart.
  for (const block of doc.body.querySelectorAll("p, li, br, h2, h3, h4, blockquote")) block.after(" ");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
};

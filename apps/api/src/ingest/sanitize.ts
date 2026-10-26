import sanitizeHtml from "sanitize-html";
import { decodeHTML } from "entities";

// Basic formatting and links only. Everything else (scripts, styles, event
// handlers, iframes, images, inline styles, classes) is removed; text inside
// removed tags is kept, except for script/style contents.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h2", "h3", "h4", "a", "blockquote"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    h1: "h2",
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer nofollow" }),
  },
  // Drop paragraphs and headings left empty once their content is removed.
  exclusiveFilter: (frame) =>
    ["p", "h2", "h3", "h4", "li"].includes(frame.tag) && frame.text.trim() === "" && !frame.mediaChildren.length,
};

// entityEncoded: Greenhouse returns its HTML escaped ("&lt;p&gt;"), so it is
// decoded first; otherwise the sanitizer would see text, not tags.
export const sanitizeDescription = (html: string, { entityEncoded = false } = {}) =>
  sanitizeHtml(entityEncoded ? decodeHTML(html) : html, OPTIONS)
    .replace(/(<br \/>\s*){3,}/g, "<br /><br />")
    .trim();

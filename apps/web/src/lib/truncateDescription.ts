export const DESCRIPTION_PREVIEW_LENGTH = 90;

// Shortens a job description for the listing card. Only descriptions longer
// than maxLength are cut (and get "..." appended).
export const truncateDescription = (text: string, maxLength = DESCRIPTION_PREVIEW_LENGTH) =>
  text.length > maxLength
    ? { text: text.substring(0, maxLength) + "...", truncated: true }
    : { text, truncated: false };

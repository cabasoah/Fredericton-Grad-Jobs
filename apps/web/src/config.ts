// Base URL of the jobs API, from VITE_API_URL (see .env.example). Defaults to
// the local API started by `npm run dev`; set it for any other environment.
// A trailing slash is removed so callers can append paths like "/jobs".
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1").replace(
  /\/+$/,
  "",
);

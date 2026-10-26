// Base URL for API requests, from VITE_API_URL (see .env.example). Falls back
// to "/api", which the Vite dev server proxies to json-server on port 8000.
// A trailing slash is removed so callers can append paths like "/jobs".
export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

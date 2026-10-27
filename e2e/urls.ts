// Where the e2e tests point.
// - Default: servers Playwright starts itself (see playwright.config.ts), on
//   ports that never clash with `npm run dev`.
// - E2E_BASE_URL set (e.g. http://localhost:8080 for docker compose): an
//   already running stack, with the API proxied under /api/v1.
export const API_PORT = 4100;
export const WEB_PORT = 3100;
export const EXTERNAL_BASE_URL = process.env.E2E_BASE_URL?.replace(/\/+$/, "");
export const WEB_URL = EXTERNAL_BASE_URL ?? `http://localhost:${WEB_PORT}`;
export const API_URL = EXTERNAL_BASE_URL ? `${EXTERNAL_BASE_URL}/api/v1` : `http://localhost:${API_PORT}/api/v1`;

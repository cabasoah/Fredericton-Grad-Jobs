import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { defineConfig, devices } from "@playwright/test";
import { API_PORT, EXTERNAL_BASE_URL, WEB_PORT, WEB_URL } from "./urls";

// By default the e2e run gets its own API, web server and database, so it
// never touches the dev servers (ports 4000/3000) or the dev data:
//   API  http://localhost:4100  against <database>_e2e (emptied on every run)
//   web  http://localhost:3100
// With E2E_BASE_URL set (CI: the docker compose stack) it starts nothing and
// tests that URL instead. The tests create their own data either way.
const root = fileURLToPath(new URL("..", import.meta.url));
const apiEnvFile = `${root}apps/api/.env`;
const apiEnv = existsSync(apiEnvFile) ? parseEnv(readFileSync(apiEnvFile, "utf8")) : {};

const e2eDatabaseUrl = () => {
  const base = process.env.DATABASE_URL ?? apiEnv.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL is not set (copy apps/api/.env.example to apps/api/.env)");
  const url = new URL(base);
  url.pathname = `${url.pathname}_e2e`;
  return url.toString();
};

export default defineConfig({
  testDir: ".",
  // The flows share one database; run them one at a time.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // CI also writes an HTML report, uploaded when a run fails.
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: `${root}playwright-report` }]] : "list",
  outputDir: `${root}test-results`,
  timeout: 30_000,
  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: EXTERNAL_BASE_URL ? undefined : [
    {
      // Empty the e2e database, then start the API against it.
      command: "npm run e2e:db && node --import tsx src/index.ts",
      cwd: `${root}apps/api`,
      url: `http://localhost:${API_PORT}/api/v1/health`,
      env: {
        DATABASE_URL: e2eDatabaseUrl(),
        PORT: String(API_PORT),
        CORS_ORIGIN: WEB_URL,
        JWT_SECRET: apiEnv.JWT_SECRET ?? "e2e-only-secret-that-is-at-least-32-characters",
        NODE_ENV: "test",
        INGEST_CRON: "false",
        LOG_LEVEL: "warn",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      cwd: `${root}apps/web`,
      url: WEB_URL,
      // BROWSER=none stops Vite opening a browser window.
      env: { VITE_API_URL: `http://localhost:${API_PORT}/api/v1`, BROWSER: "none" },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});

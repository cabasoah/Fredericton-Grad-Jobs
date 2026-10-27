import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { defineConfig, devices } from "@playwright/test";
import { API_PORT, WEB_PORT, WEB_URL } from "./urls";

// The e2e run gets its own API, web server and database, so it never
// touches the dev servers (ports 4000/3000) or the dev data:
//   API  http://localhost:4100  against <database>_e2e (reset on every run)
//   web  http://localhost:3100
const root = fileURLToPath(new URL("..", import.meta.url));
const apiEnvFile = `${root}apps/api/.env`;
const apiEnv = existsSync(apiEnvFile) ? parseEnv(readFileSync(apiEnvFile, "utf8")) : {};

const baseDatabaseUrl = process.env.DATABASE_URL ?? apiEnv.DATABASE_URL;
if (!baseDatabaseUrl) throw new Error("DATABASE_URL is not set (copy apps/api/.env.example to apps/api/.env)");
const e2eDatabase = new URL(baseDatabaseUrl);
e2eDatabase.pathname = `${e2eDatabase.pathname}_e2e`;

export default defineConfig({
  testDir: ".",
  // The flows share one database; run them one at a time.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    {
      // Reset and seed the e2e database, then start the API against it.
      command: "npm run e2e:db && node --import tsx src/index.ts",
      cwd: `${root}apps/api`,
      url: `http://localhost:${API_PORT}/api/v1/health`,
      env: {
        DATABASE_URL: e2eDatabase.toString(),
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

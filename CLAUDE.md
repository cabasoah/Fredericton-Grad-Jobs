# CLAUDE.md

Every session working in this repo must follow these instructions.

## Project

Full-stack job board + personal application tracker.

- **Target stack:**
  - Frontend: React 19 + TypeScript + Vite
  - Backend: Express + TypeScript + Prisma + PostgreSQL (once migrated)
- **Current state:** an npm workspaces monorepo, "Fredericton Grad Jobs". `apps/web` is the React + TypeScript (strict) + Vite + Tailwind app. `apps/api` is the Express 5 + Prisma 7 + PostgreSQL API under `/api/v1`, run with `tsx` in development and bundled with esbuild for production. `packages/shared` holds the Zod schemas and types both use. `docker-compose.yml` runs Postgres (host port 5433) alone for development, or db + api + web (nginx, port 8080) together. CI is `.github/workflows/ci.yml`; deployment config is `fly.toml` (API on Fly.io) and `apps/web/vercel.json` (web on Vercel), with Postgres on Neon. Authentication: JWT in an httpOnly cookie, roles SEEKER and EMPLOYER; only employers post jobs (for their own company) and only a job's poster can edit or delete it. Real postings are imported from Greenhouse and Lever by `apps/api/src/ingest` (companies in `companies.ts`, runs logged in the `IngestRun` table); imported jobs are read-only. Seekers track applications (`Application`, with every stage change logged in `ApplicationEvent`) through `/api/v1/applications`, scoped to the signed-in user (404 for other users' rows); the web app has a Save button on jobs, a `/tracker` Kanban board (dnd-kit) and a `/dashboard` (Recharts), both lazy-loaded.

## Rules

- Make small, focused commits using Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`). One logical change per commit.
- Never claim a feature in README or docs unless it exists and works.
- Never invent metrics. Only report numbers you measured, and say how.
- Run lint, typecheck and tests before declaring a task done. Report the actual output.
- Prefer editing existing files over rewriting them. Do not reformat unrelated code.
- No new dependency without stating why in the commit body.
- Keep secrets in `.env` files; commit only `.env.example`.
- When a task is ambiguous, stop and ask instead of guessing.

## Commands

Update this section as phases add commands. Only list commands that exist in `package.json`. Run everything from the repo root.

| Task | Command | Notes |
| --- | --- | --- |
| Install | `npm install` | Installs all workspaces and generates the Prisma client |
| Env setup | `cp apps/api/.env.example apps/api/.env` | One time; includes a dev-only `JWT_SECRET` and `SEED_USER_PASSWORD`. The web app's `VITE_API_URL` has a dev default |
| Database | `docker compose up -d db` | PostgreSQL 17 on host port 5433 |
| Migrate | `npm run db:migrate` | `prisma migrate dev` then `prisma generate` |
| Seed | `npm run db:seed` | Loads `apps/api/prisma/seed-data/jobs.json` into an empty DB, then creates demo employers for unowned jobs |
| Prisma client | `npm run db:generate` | Regenerate after schema changes |
| Import jobs | `npm run ingest` | Pulls the boards in `apps/api/src/ingest/companies.ts` once; `INGEST_CRON=true` also runs it every 6 hours in the API |
| Dev server | `npm run dev` | API on port 4000 and web on port 3000 (`concurrently`) |
| Typecheck | `npm run typecheck` | `tsc --noEmit` in every workspace |
| Lint | `npm run lint` | ESLint with typescript-eslint type-checked rules |
| Tests | `npm test` | Unit tests in every workspace plus web component tests (RTL + MSW), no database needed |
| Integration tests | `npm run test:integration` | API tests against `TEST_DATABASE_URL` or `<db>_test`; needs the db container |
| E2E tests | `npm run test:e2e` | Playwright; run `npx playwright install chromium` once. Starts its own API (4100) and web (3100) against `<db>_e2e`, reset by `npm run e2e:db -w apps/api`; needs the db container |
| Coverage | `npm run coverage` | v8 coverage for api (unit + integration, needs the db container) and web |
| Build | `npm run build` | Web app into `apps/web/dist`, API bundle (esbuild) into `apps/api/dist`; `npm start -w apps/api` runs the bundle |
| Full stack in Docker | `docker compose up --build` | db + api + web at http://localhost:8080; migrates and seeds on first start |
| Preview build | `npm run preview` | Serves the `apps/web` production build |
| Format | `npm run format` / `npm run format:check` | Prettier |

# Fredericton Grad Jobs

A job board built with React, TypeScript and Vite on the front end and an Express + Prisma + PostgreSQL API on the back end. It started as a tutorial project and is being upgraded in phases.

## What it does today

- Home page with a hero, two call-to-action cards and the 3 most recent jobs
- Jobs page listing jobs 20 at a time with a "Load more" button, an error message and Retry button if the API is unreachable, and an empty state when there are no jobs
- Job detail page with type, work arrangement, salary range, and company and contact info
- Add a job (`/add-job`), edit a job (`/edit-job/:id`) and delete a job (with a confirmation prompt). Form input is validated with the same Zod schemas the API uses.
- "Job Not Found" page for unknown job IDs and a 404 page for unknown routes

There is no authentication yet: anyone who can reach the API can add, edit or delete jobs.

## Repository layout

An npm workspaces monorepo:

```
apps/web         React app (Vite, React Router, Tailwind CSS)
apps/api         REST API (Express 5, Prisma 7, PostgreSQL, pino)
packages/shared  Zod schemas and types shared by web and api
docker-compose.yml  PostgreSQL for local development
```

## Tech

React 19, React Router 7, Vite 7, Tailwind CSS 4, TypeScript 6 (strict), Express 5, Prisma 7, PostgreSQL 17, Zod 4, pino, Vitest, Supertest, ESLint with typescript-eslint, Prettier.

## Running it

Requires Node.js, npm and Docker. All commands run from the repository root.

One-time setup:

```bash
npm install
cp apps/api/.env.example apps/api/.env   # DATABASE_URL, PORT, CORS_ORIGIN
```

Then:

```bash
docker compose up -d db   # PostgreSQL on localhost:5433
npm run db:migrate        # apply migrations
npm run db:seed           # load the sample jobs (does nothing if jobs already exist)
npm run dev               # API on http://localhost:4000, web app on http://localhost:3000
```

The database is exposed on host port 5433 so it does not clash with a locally installed PostgreSQL on 5432.

The web app calls the API at `VITE_API_URL` (default `http://localhost:4000/api/v1`, see `apps/web/.env.example`). The API only accepts browser requests from `CORS_ORIGIN` (default `http://localhost:3000`), so the web dev server refuses to start on any other port.

## API

All endpoints are under `/api/v1`. Errors use the shape `{ "error": { "code", "message", "details?" } }`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | 200 when the database is reachable, 503 otherwise |
| GET | `/jobs` | Query: `q`, `type`, `remote`, `location`, `salaryMin`, `tags`, `status` (default `OPEN`), `sort` (`newest`, `salary_desc`, `salary_asc`), `cursor`, `limit` (max 50). Returns `{ data, nextCursor }` |
| GET | `/jobs/:id` | |
| POST | `/jobs` | Body takes `companyId` or `company` details; a company with the same name is reused |
| PATCH | `/jobs/:id` | Only the sent fields change |
| DELETE | `/jobs/:id` | |
| GET | `/companies` | Each with its number of open jobs |
| GET | `/companies/:id` | With its open jobs |

Write routes (POST, PATCH, DELETE) are rate limited to 60 requests per 15 minutes per client.

## Other scripts

```bash
npm run typecheck         # tsc in every workspace
npm run lint              # ESLint
npm test                  # unit tests in every workspace (no database needed)
npm run test:integration  # API tests against a jobs_test database (needs the db container)
npm run build             # production build of the web app into apps/web/dist/
npm run preview           # serve the production build
npm run db:generate       # regenerate the Prisma client
npm run format            # Prettier (write)
npm run format:check      # Prettier (check only)
```

## Roadmap

Not built yet:

- Authentication and user accounts
- Personal application tracker (the `User` and `Application` tables exist but are unused)
- Job imports from Greenhouse and Lever
- A production build/start setup for the API (it currently runs with `tsx` in development only)

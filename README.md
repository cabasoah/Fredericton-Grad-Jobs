# Fredericton Grad Jobs

A job board built with React, TypeScript and Vite on the front end and an Express + Prisma + PostgreSQL API on the back end. It started as a tutorial project and is being upgraded in phases.

## What it does today

- Real job postings imported from public Greenhouse and Lever job boards (the companies are listed in `apps/api/src/ingest/companies.ts`). Postings that disappear from a board are marked closed. Imported descriptions are shown as sanitized HTML with an Apply link to the original posting, and cannot be edited.
- Home page with live counts (open jobs per source and when jobs were last imported), two call-to-action cards and the 3 most recent jobs
- Jobs page with search (title, description and company) and filters for job type, work arrangement, location, minimum salary and tags, plus sorting by newest or salary. Filters live in the URL, so a filtered view can be shared or bookmarked and survives a refresh. Jobs load 20 at a time with a "Load more" button.
- Loading placeholders shaped like the job cards, an error message with Retry if the API is unreachable, and empty states ("No jobs match these filters" with a Clear filters button)
- Job detail page with type, work arrangement, full salary range, how long ago it was posted, tags, an Apply link when the employer gave one, and company and contact info
- Pop-up notifications when a job is posted, updated or deleted, or when that fails. Deleting removes the job from the list immediately and puts it back if the server refuses.
- On phones the navigation collapses into a menu button
- Accounts: register as a **job seeker** or an **employer** (employers create their company at sign-up), log in and log out. The navbar shows Login/Register or your name and Logout.
- Employers add jobs (`/add-job`) for their own company. Only the employer who posted a job sees Edit and Delete for it, and only they can change it (`/edit-job/:id`). Imported jobs cannot be edited by anyone. Form input is validated with the same Zod schemas the API uses, with errors shown under each field.
- Job seekers have a personal application tracker:
  - A Save button on job cards and job pages adds the job to the tracker as Saved.
  - `/tracker` is a Kanban board with one column per stage (Saved, Applied, Online assessment, Interview, Offer, Rejected, Withdrawn). Cards move by dragging or with the keyboard (Space to pick up, Left/Right to change column, Space to drop, Escape to cancel). The move shows at once and is undone with a message if the server refuses it.
  - Clicking a card opens a side panel with the stage, applied and follow-up dates, URL, notes, links to the job, and the history of every stage change.
  - Applications to jobs found elsewhere can be added with a form, and all applications can be exported as a CSV file.
  - `/dashboard` shows the response rate, a funnel of how many applications reached each stage, and applications per week for the last 12 weeks (Monday to Sunday, Atlantic time). Each chart can also be shown as a table.
- Visiting an employer-only or seeker-only page while signed out redirects to the login page and back afterwards.
- "Job Not Found" page for unknown job IDs and a 404 page for unknown routes

## Repository layout

An npm workspaces monorepo:

```
apps/web         React app (Vite, React Router, Tailwind CSS)
apps/api         REST API (Express 5, Prisma 7, PostgreSQL, pino)
packages/shared  Zod schemas and types shared by web and api
docker-compose.yml  PostgreSQL for local development
```

## Tech

React 19, React Router 7, TanStack Query 5, React Hook Form, Vite 7, Tailwind CSS 4, TypeScript 6 (strict), Express 5, Prisma 7, PostgreSQL 17, Zod 4, dnd-kit, Recharts, pino, node-cron, sanitize-html, DOMPurify, Vitest, Supertest, ESLint with typescript-eslint, Prettier.

## Running it

Requires Node.js, npm and Docker. All commands run from the repository root.

One-time setup:

```bash
npm install
cp apps/api/.env.example apps/api/.env   # DATABASE_URL, PORT, CORS_ORIGIN, JWT_SECRET, SEED_USER_PASSWORD
```

The example `JWT_SECRET` only works for local development (the API refuses to start with it in production). `.env.example` shows how to generate a real one.

Then:

```bash
docker compose up -d db   # PostgreSQL on localhost:5433
npm run db:migrate        # apply migrations and regenerate the Prisma client
npm run db:seed           # sample jobs (only into an empty database) and demo employer accounts
npm run dev               # API on http://localhost:4000, web app on http://localhost:3000
npm run ingest            # optional: import real postings from the job boards once
```

The seed prints one demo employer per sample company, e.g. `newtek-solutions@employers.example.com`, each owning that company's job. Their password is `SEED_USER_PASSWORD` from `apps/api/.env`.

The database is exposed on host port 5433 so it does not clash with a locally installed PostgreSQL on 5432.

The web app calls the API at `VITE_API_URL` (default `http://localhost:4000/api/v1`, see `apps/web/.env.example`). The API only accepts browser requests from `CORS_ORIGIN` (default `http://localhost:3000`), so the web dev server refuses to start on any other port.

## API

All endpoints are under `/api/v1`. Errors use the shape `{ "error": { "code", "message", "details?" } }`.

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/health` | Anyone | 200 when the database is reachable, 503 otherwise |
| POST | `/auth/register` | Anyone | Role `SEEKER` or `EMPLOYER`; employers send `company` details and get a new company (409 if the name is taken). Email is lowercased and unique; password at least 10 characters |
| POST | `/auth/login` | Anyone | Sets the session cookie. Rate limited: 20 attempts per IP and 5 failed attempts per email per 15 minutes |
| POST | `/auth/logout` | Anyone | Clears the session cookie |
| GET | `/auth/me` | Signed in | The current user |
| GET | `/jobs` | Anyone | Query: `q`, `type`, `remote`, `location`, `salaryMin`, `tags`, `status` (default `OPEN`), `sort` (`newest`, `salary_desc`, `salary_asc`), `cursor`, `limit` (max 50). Returns `{ data, nextCursor }` |
| GET | `/jobs/:id` | Anyone | |
| POST | `/jobs` | Employers | Posted for the employer's own company |
| PATCH | `/jobs/:id` | The job's poster | Only the sent fields change. 403 for anyone else and for imported jobs |
| DELETE | `/jobs/:id` | The job's poster | 403 for anyone else and for imported jobs |
| GET | `/companies` | Anyone | Each with its number of open jobs |
| GET | `/companies/:id` | Anyone | With its open jobs |
| GET | `/stats` | Anyone | Open jobs in total and per source, and when the last import without errors finished |
| GET | `/applications` | Seekers | Your applications, most recently updated first. Returns `{ data }` |
| GET | `/applications/stats` | Seekers | Counts per stage, the funnel, applications per ISO week for the last 12 weeks (by applied date, America/Moncton), and the response rate |
| GET | `/applications/:id` | Seekers | One of your applications with its stage history |
| POST | `/applications` | Seekers | Either `{ jobId }` to save a job from this board (409 if it is already in your tracker) or `companyName`, `roleTitle` and optional `url`, `stage`, `appliedAt`, `nextFollowUpAt`, `notes` for a job found elsewhere |
| PATCH | `/applications/:id` | Seekers | Only the sent fields change. A stage change is recorded in the history; the applied date is set the first time it reaches Applied or later, if empty |
| DELETE | `/applications/:id` | Seekers | Also deletes its history |

Every `/applications` route only sees the signed-in seeker's own applications. Someone else's application gets 404, the same as one that does not exist, so its existence is not revealed.

The response rate is the number of applications that reached Online assessment, Interview, Offer or Rejected, divided by the number that reached Applied or later. A withdrawn application counts towards the second number only if its history shows it reached Applied.

Sessions are a JWT in an httpOnly, SameSite=Lax cookie (Secure in production) that expires after 1 hour; there is no refresh token, so users sign in again after that. Requests without a valid session get 401, and signed-in users without permission get 403.

Write routes (POST, PATCH, DELETE on jobs) are rate limited to 60 requests per 15 minutes per client.

## Job imports

`npm run ingest` fetches every board in `apps/api/src/ingest/companies.ts` once (edit that list to change companies) and prints the rows it wrote to the `IngestRun` table: fetched, created, updated, closed and errors per company. Set `INGEST_CRON=true` in `apps/api/.env` to also run it every 6 hours while the API is running.

- Jobs are matched on (source, posting id), so running it again never creates duplicates; postings no longer listed are marked closed.
- Requests time out after 15 seconds, retry server and network errors with exponential backoff, pause 1 second between companies, and identify the project in their User-Agent.
- Descriptions are sanitized to basic formatting and links before they are stored, and again in the browser before they are shown.

## Other scripts

```bash
npm run typecheck         # tsc in every workspace
npm run lint              # ESLint
npm test                  # unit tests in every workspace (no database needed)
npm run test:integration  # API tests against a jobs_test database (needs the db container)
npm run build             # production build of the web app into apps/web/dist/
npm run preview           # serve the production build
npm run db:generate       # regenerate the Prisma client
npm run ingest            # import postings from the job boards once
npm run format            # Prettier (write)
npm run format:check      # Prettier (check only)
```

## Roadmap

Not built yet:

- Inviting more employers to an existing company, password reset and email verification
- A production build/start setup for the API (it currently runs with `tsx` in development only)

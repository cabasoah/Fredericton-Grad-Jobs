# Fredericton Grad Jobs

A job board built with React, TypeScript and Vite on the front end and an Express + Prisma + PostgreSQL API on the back end. It started as a tutorial project and is being upgraded in phases.

## What it does today

- Home page with a hero, two call-to-action cards and the 3 most recent jobs
- Jobs page with search (title, description and company) and filters for job type, work arrangement, location, minimum salary and tags, plus sorting by newest or salary. Filters live in the URL, so a filtered view can be shared or bookmarked and survives a refresh. Jobs load 20 at a time with a "Load more" button.
- Loading placeholders shaped like the job cards, an error message with Retry if the API is unreachable, and empty states ("No jobs match these filters" with a Clear filters button)
- Job detail page with type, work arrangement, full salary range, how long ago it was posted, tags, an Apply link when the employer gave one, and company and contact info
- Pop-up notifications when a job is posted, updated or deleted, or when that fails. Deleting removes the job from the list immediately and puts it back if the server refuses.
- On phones the navigation collapses into a menu button
- Accounts: register as a **job seeker** or an **employer** (employers create their company at sign-up), log in and log out. The navbar shows Login/Register or your name and Logout.
- Employers add jobs (`/add-job`) for their own company. Only the employer who posted a job sees Edit and Delete for it, and only they can change it (`/edit-job/:id`). Imported jobs cannot be edited by anyone. Form input is validated with the same Zod schemas the API uses, with errors shown under each field.
- Visiting an employer-only page while signed out redirects to the login page and back afterwards.
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

React 19, React Router 7, TanStack Query 5, React Hook Form, Vite 7, Tailwind CSS 4, TypeScript 6 (strict), Express 5, Prisma 7, PostgreSQL 17, Zod 4, pino, Vitest, Supertest, ESLint with typescript-eslint, Prettier.

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

Sessions are a JWT in an httpOnly, SameSite=Lax cookie (Secure in production) that expires after 1 hour; there is no refresh token, so users sign in again after that. Requests without a valid session get 401, and signed-in users without permission get 403.

Write routes (POST, PATCH, DELETE on jobs) are rate limited to 60 requests per 15 minutes per client.

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

- Personal application tracker (the `Application` table exists but is unused)
- Inviting more employers to an existing company, password reset and email verification
- Job imports from Greenhouse and Lever
- A production build/start setup for the API (it currently runs with `tsx` in development only)

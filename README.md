# Fredericton Grad Jobs

A small job board built with React, TypeScript and Vite. It started as a tutorial project and is being upgraded in phases.

## What it does today

- Home page with a hero, two call-to-action cards and the 3 most recent jobs
- Jobs page listing every job, with an error message and Retry button if the API is unreachable, and an empty state when there are no jobs
- Job detail page with company and contact info
- Add a job (`/add-job`), edit a job (`/edit-job/:id`) and delete a job (with a confirmation prompt)
- "Job Not Found" page for unknown job IDs and a 404 page for unknown routes

Data is stored in `apps/web/db/jobs.json` and served by [json-server](https://github.com/typicode/json-server), a mock REST API. There is no real backend, authentication or database yet.

## Repository layout

An npm workspaces monorepo:

```
apps/web         React app (Vite, React Router, Tailwind CSS)
apps/api         Placeholder for the upcoming Express API (empty for now)
packages/shared  Job types and Zod schemas used by the web app
```

## Tech

React 19, React Router 7, Vite 7, Tailwind CSS 4, TypeScript 6 (strict), Zod 4, json-server 1 (beta), Vitest, ESLint with typescript-eslint, Prettier.

## Running it

Requires Node.js and npm. All commands run from the repository root.

```bash
npm install
npm run server   # json-server on http://localhost:8000, serving apps/web/db/jobs.json
npm run dev      # Vite dev server on http://localhost:3000
```

Run `server` and `dev` in separate terminals. The app sends API requests to `VITE_API_URL` (default `/api`, see `apps/web/.env.example`). The dev server proxies `/api/*` to `http://localhost:8000`, so `/api/jobs` reaches json-server's `/jobs`.

Other scripts:

```bash
npm run typecheck     # tsc in every workspace
npm run lint          # ESLint
npm test              # Vitest in every workspace
npm run build         # production build into apps/web/dist/
npm run preview       # serve the production build
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only)
```

## Roadmap

Not built yet:

- Express + TypeScript backend with Prisma and PostgreSQL in `apps/api`, replacing json-server
- Personal application tracker

# React Jobs

A small job board built with React and Vite. It started as a tutorial project and is being upgraded in phases.

## What it does today

- Home page with a hero, two call-to-action cards and the 3 most recent jobs
- Jobs page listing every job, with an error message and Retry button if the API is unreachable, and an empty state when there are no jobs
- Job detail page with company and contact info
- Add a job (`/add-job`), edit a job (`/edit-job/:id`) and delete a job (with a confirmation prompt)
- "Job Not Found" page for unknown job IDs and a 404 page for unknown routes

Data is stored in `db/jobs.json` and served by [json-server](https://github.com/typicode/json-server), a mock REST API. There is no real backend, authentication or database yet.

## Tech

React 19, React Router 7, Vite 7, Tailwind CSS 4, json-server 1 (beta). JavaScript only for now.

## Running it

Requires Node.js and npm.

```bash
npm install
npm run server   # json-server on http://localhost:8000, serving db/jobs.json
npm run dev      # Vite dev server on http://localhost:3000
```

Run `server` and `dev` in separate terminals. The dev server proxies `/api/*` to `http://localhost:8000`, so `/api/jobs` reaches json-server's `/jobs`.

Other scripts:

```bash
npm run lint     # ESLint
npm run build    # production build into dist/
npm run preview  # serve the production build
```

There are no automated tests yet.

## Roadmap

Not built yet:

- TypeScript migration of the frontend
- Express + TypeScript backend with Prisma and PostgreSQL, replacing json-server
- Personal application tracker
- Automated tests and a typecheck step

# Development

## Setup without Docker for the app

Requires Node.js, npm and Docker (for PostgreSQL only). All commands run from the repository root.

```bash
npm install
cp apps/api/.env.example apps/api/.env   # DATABASE_URL, PORT, CORS_ORIGIN, JWT_SECRET, SEED_USER_PASSWORD
docker compose up -d db                  # PostgreSQL on localhost:5433
npm run db:migrate                       # apply migrations and regenerate the Prisma client
npm run db:seed                          # sample jobs (only into an empty database) and demo employer accounts
npm run dev                              # API on http://localhost:4000, web app on http://localhost:3000
npm run ingest                           # optional: import real postings from the job boards once
```

The example `JWT_SECRET` only works for local development (the API refuses to start with it in production). `.env.example` shows how to generate a real one.

The seed prints one demo employer per sample company, e.g. `newtek-solutions@employers.example.com`, each owning that company's job. Their password is `SEED_USER_PASSWORD` from `apps/api/.env`.

The database is exposed on host port 5433 so it does not clash with a locally installed PostgreSQL on 5432. The web app calls the API at `VITE_API_URL` (default `http://localhost:4000/api/v1`, see `apps/web/.env.example`). The API only accepts browser requests from `CORS_ORIGIN` (default `http://localhost:3000`), so the web dev server refuses to start on any other port.

## Repository layout

```
apps/web            React app (Vite, React Router, Tailwind CSS)
apps/api            REST API (Express 5, Prisma 7, PostgreSQL, pino) and the job import
packages/shared     Zod schemas and types shared by web and api
e2e                 Playwright end-to-end tests
docker-compose.yml  db, api and web together (or just db for development)
fly.toml            API deployment (Fly.io); apps/web/vercel.json is the web app's (Vercel)
```

## Scripts

```bash
npm run typecheck         # tsc in every workspace and e2e/
npm run lint              # ESLint
npm test                  # unit and web component tests (no database needed)
npm run test:integration  # API tests against a jobs_test database (needs the db container)
npm run test:e2e          # Playwright flows in Chromium (needs the db container)
npm run coverage          # v8 coverage for the API (unit + integration) and web app
npm run build             # production builds: web app into apps/web/dist/, API bundle into apps/api/dist/
npm run preview           # serve the web production build
npm start -w apps/api     # run the API bundle (after npm run build)
npm run db:generate       # regenerate the Prisma client
npm run ingest            # import postings from the job boards once
npm run format            # Prettier (write)
npm run format:check      # Prettier (check only)
```

## Tests

- **Unit tests** (Vitest) for pure logic in every workspace.
- **Web component tests** (Vitest, React Testing Library, jsdom) render pages with the real providers and router. MSW answers their API calls at the network layer, and any request without a handler fails the test.
- **API integration tests** (Supertest) run real HTTP requests against PostgreSQL. They use `TEST_DATABASE_URL`, or DATABASE_URL's database plus `_test`, which is created and migrated automatically and emptied before every test.
- **End-to-end tests** (Playwright) cover three flows: an employer registers, posts a job and finds it in search; a job seeker searches with filters and opens a job; a job seeker saves a job and drags it to Applied on the tracker. Run `npx playwright install chromium` once. `npm run test:e2e` starts its own API on port 4100 and web server on port 3100 against `<database>_e2e`, which is emptied on every run, so your dev servers and data are untouched. With `E2E_BASE_URL` set (e.g. `http://localhost:8080`) it tests an already running stack instead. Each flow creates the data it needs.

CI (`.github/workflows/ci.yml`) runs on every push and pull request: lint, typecheck, unit and component tests, API integration tests against a Postgres service container, and the builds; then the Playwright flows against the docker compose stack. When they fail, the Playwright report and traces are uploaded as an artifact.

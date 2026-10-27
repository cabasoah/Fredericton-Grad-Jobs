# API reference

All endpoints are under `/api/v1`. Errors use the shape `{ "error": { "code", "message", "details?" } }`.

| Method | Path                  | Who              | Notes                                                                                                                                                                                                               |
| ------ | --------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/health`             | Anyone           | 200 when the database is reachable, 503 otherwise                                                                                                                                                                   |
| POST   | `/auth/register`      | Anyone           | Role `SEEKER` or `EMPLOYER`; employers send `company` details and get a new company (409 if the name is taken). Email is lowercased and unique; password at least 10 characters                                     |
| POST   | `/auth/login`         | Anyone           | Sets the session cookie. Rate limited: 20 attempts per IP and 5 failed attempts per email per 15 minutes                                                                                                            |
| POST   | `/auth/logout`        | Anyone           | Clears the session cookie                                                                                                                                                                                           |
| GET    | `/auth/me`            | Signed in        | The current user                                                                                                                                                                                                    |
| GET    | `/jobs`               | Anyone           | Query: `q`, `type`, `remote`, `location`, `salaryMin`, `tags`, `status` (default `OPEN`), `sort` (`newest`, `salary_desc`, `salary_asc`), `cursor`, `limit` (max 50). Returns `{ data, nextCursor }`                |
| GET    | `/jobs/:id`           | Anyone           |                                                                                                                                                                                                                     |
| POST   | `/jobs`               | Employers        | Posted for the employer's own company                                                                                                                                                                               |
| PATCH  | `/jobs/:id`           | The job's poster | Only the sent fields change. 403 for anyone else and for imported jobs                                                                                                                                              |
| DELETE | `/jobs/:id`           | The job's poster | 403 for anyone else and for imported jobs                                                                                                                                                                           |
| GET    | `/companies`          | Anyone           | Each with its number of open jobs                                                                                                                                                                                   |
| GET    | `/companies/:id`      | Anyone           | With its open jobs                                                                                                                                                                                                  |
| GET    | `/stats`              | Anyone           | Open jobs in total and per source, and when the last import without errors finished                                                                                                                                 |
| GET    | `/applications`       | Seekers          | Your applications, most recently updated first. Returns `{ data }`                                                                                                                                                  |
| GET    | `/applications/stats` | Seekers          | Counts per stage, the funnel, applications per ISO week for the last 12 weeks (by applied date, America/Moncton), and the response rate                                                                             |
| GET    | `/applications/:id`   | Seekers          | One of your applications with its stage history                                                                                                                                                                     |
| POST   | `/applications`       | Seekers          | Either `{ jobId }` to save a job from this board (409 if it is already in your tracker) or `companyName`, `roleTitle` and optional `url`, `stage`, `appliedAt`, `nextFollowUpAt`, `notes` for a job found elsewhere |
| PATCH  | `/applications/:id`   | Seekers          | Only the sent fields change. A stage change is recorded in the history; the applied date is set the first time it reaches Applied or later, if empty                                                                |
| DELETE | `/applications/:id`   | Seekers          | Also deletes its history                                                                                                                                                                                            |

Every `/applications` route only sees the signed-in seeker's own applications. Someone else's application gets 404, the same as one that does not exist, so its existence is not revealed.

The response rate is the number of applications that reached Online assessment, Interview, Offer or Rejected, divided by the number that reached Applied or later. A withdrawn application counts towards the second number only if its history shows it reached Applied.

## Sessions and limits

Sessions are a JWT in an httpOnly, SameSite=Lax cookie (Secure in production) that expires after 1 hour; there is no refresh token, so users sign in again after that. Requests without a valid session get 401, and signed-in users without permission get 403.

Write routes (POST, PATCH, DELETE on jobs) are rate limited to 60 requests per 15 minutes per client. Behind proxies, `TRUST_PROXY` sets how many there are, so limits apply per client rather than per proxy.

## Job imports

`npm run ingest` fetches every board in `apps/api/src/ingest/companies.ts` once (edit that list to change companies) and prints the rows it wrote to the `IngestRun` table: fetched, created, updated, closed and errors per company. With `INGEST_CRON=true` the API also runs it every 6 hours.

- Jobs are matched on (source, posting id), so running it again never creates duplicates; postings no longer listed are marked closed.
- Requests time out after 15 seconds, retry server and network errors with exponential backoff, pause 1 second between companies, and identify the project in their User-Agent.
- Descriptions are sanitized to basic formatting and links before they are stored, and again in the browser before they are shown.

import type { Job, User } from "@fredericton-grad-jobs/shared";

// Mirrors the API rule: only the employer who posted a job can edit or delete
// it, and imported jobs (source != MANUAL) cannot be changed by anyone. The
// API enforces this; the UI uses it to hide controls that would fail.
export const canManageJob = (user: User | null, job: Pick<Job, "source" | "postedById">) =>
  user !== null && job.source === "MANUAL" && job.postedById === user.id;

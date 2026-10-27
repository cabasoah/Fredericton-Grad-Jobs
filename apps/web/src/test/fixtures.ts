import type { Application, Job, User } from "@fredericton-grad-jobs/shared";

// Objects in the API's response shape; the API client validates responses,
// so these must satisfy the shared schemas.
const timestamp = "2026-10-20T12:00:00.000Z";

export const company = {
  id: "company-acme",
  name: "Acme",
  description: null,
  website: null,
  logoUrl: null,
  contactEmail: "jobs@acme.test",
  contactPhone: null,
  createdAt: timestamp,
};

export const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: "job-1",
  title: "Junior Developer",
  description: "Build things.",
  type: "FULL_TIME",
  remote: "ONSITE",
  location: "Fredericton, NB",
  salaryMin: null,
  salaryMax: null,
  currency: "CAD",
  tags: [],
  externalUrl: null,
  status: "OPEN",
  source: "MANUAL",
  externalId: null,
  postedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  companyId: company.id,
  postedById: "user-erin",
  company,
  ...overrides,
});

export const seeker: User = { id: "user-sam", email: "sam@example.test", name: "Sam", role: "SEEKER", company: null };

export const employer: User = {
  id: "user-erin",
  email: "erin@acme.test",
  name: "Erin",
  role: "EMPLOYER",
  company: { id: company.id, name: company.name },
};

export const makeApplication = (overrides: Partial<Application> = {}): Application => ({
  id: "app-1",
  jobId: null,
  companyName: "Acme",
  roleTitle: "Junior Developer",
  url: null,
  stage: "SAVED",
  appliedAt: null,
  nextFollowUpAt: null,
  notes: "",
  createdAt: timestamp,
  updatedAt: timestamp,
  ...overrides,
});

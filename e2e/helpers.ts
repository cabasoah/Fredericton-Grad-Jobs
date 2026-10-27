import { expect, request, type Page } from "@playwright/test";
import { API_URL } from "./urls";

// Unique per call, so flows never collide on emails, companies or job titles,
// and do not depend on what else is in the database.
export const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

// Registers a job seeker through the API; the session cookie lands in the
// page's browser context, so the next page load is signed in.
export const registerSeeker = async (page: Page) => {
  const email = `${unique("seeker")}@example.test`;
  const res = await page.request.post(`${API_URL}/auth/register`, {
    data: { role: "SEEKER", name: "Sam Seeker", email, password: "a long enough password" },
  });
  expect(res.status()).toBe(201);
  return email;
};

type NewJob = { title: string; type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP"; location: string };

// Posts jobs as a new employer, in a separate API session so the page's own
// session is not affected. Returns the employer's company name.
export const postJobsAsNewEmployer = async (jobs: NewJob[]) => {
  const company = unique("Beta Labs");
  const api = await request.newContext();
  try {
    const registered = await api.post(`${API_URL}/auth/register`, {
      data: {
        role: "EMPLOYER",
        name: "Erin Employer",
        email: `${unique("employer")}@example.test`,
        password: "a long enough password",
        company: { name: company },
      },
    });
    expect(registered.status()).toBe(201);
    for (const job of jobs) {
      const posted = await api.post(`${API_URL}/jobs`, { data: { ...job, description: "Posted by the e2e tests." } });
      expect(posted.status()).toBe(201);
    }
  } finally {
    await api.dispose();
  }
  return company;
};

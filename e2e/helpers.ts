import { expect, type Page } from "@playwright/test";
import { API_URL } from "./urls";

// Unique per call, so flows never collide on emails or company names.
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

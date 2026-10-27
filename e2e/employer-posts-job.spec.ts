import { expect, test } from "@playwright/test";
import { unique } from "./helpers";

test("an employer registers, posts a job and finds it in search", async ({ page }) => {
  const company = unique("Gamma Co");
  const title = `Graduate QA Tester ${unique("qa")}`;

  // Register through the form.
  await page.goto("/register");
  await page.getByLabel("Employer").check();
  await page.getByLabel("Your Name").fill("Erin Employer");
  await page.getByLabel("Email", { exact: true }).fill(`${unique("erin")}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("a long enough password");
  await page.getByLabel("Company Name").fill(company);
  await page.getByLabel("Contact Email for Applicants").fill("jobs@gamma.example");
  await page.getByRole("button", { name: "Create Account" }).click();

  // New employers land on Add Job.
  await expect(page).toHaveURL(/\/add-job$/);
  await expect(page.getByText(`Posting as ${company}`)).toBeVisible();

  await page.getByLabel("Job Type").selectOption("INTERNSHIP");
  await page.getByLabel("Job Listing Name").fill(title);
  await page.getByLabel("Description").fill("Test the product before every release.");
  await page.getByLabel("Location").fill("Fredericton, NB");
  await page.getByRole("button", { name: "Add Job" }).click();

  await expect(page).toHaveURL(/\/jobs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  // The new job is searchable, with a filter applied too.
  await page.goto("/jobs");
  await page.getByLabel("Search jobs").fill(title);
  await page.getByLabel("Job type").selectOption("INTERNSHIP");
  await expect(page).toHaveURL(/type=INTERNSHIP/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read More" })).toHaveCount(1);
});

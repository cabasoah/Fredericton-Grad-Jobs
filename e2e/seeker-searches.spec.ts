import { expect, test } from "@playwright/test";
import { registerSeeker } from "./helpers";

// Uses the jobs seeded by apps/api/src/test/e2eDb.ts.
test("a job seeker searches with filters and opens a job", async ({ page }) => {
  await registerSeeker(page);
  await page.goto("/jobs");

  await page.getByLabel("Search jobs").fill("data");
  await expect(page.getByRole("heading", { name: "Junior Data Analyst" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Senior Data Engineer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Frontend Developer" })).toBeHidden();

  await page.getByLabel("Job type").selectOption("PART_TIME");
  await expect(page.getByRole("heading", { name: "Senior Data Engineer" })).toBeHidden();
  await expect(page).toHaveURL(/q=data/);
  await expect(page).toHaveURL(/type=PART_TIME/);

  // Filters live in the URL, so they survive a reload.
  await page.reload();
  await expect(page.getByLabel("Search jobs")).toHaveValue("data");
  await expect(page.getByRole("link", { name: "Read More" })).toHaveCount(1);

  await page.getByRole("link", { name: "Read More" }).click();
  await expect(page).toHaveURL(/\/jobs\/[^/?]+$/);
  await expect(page.getByRole("heading", { name: "Junior Data Analyst" })).toBeVisible();
  await expect(page.getByText("Acme Analytics").first()).toBeVisible();
  await expect(page.getByText("Moncton, NB").first()).toBeVisible();
});

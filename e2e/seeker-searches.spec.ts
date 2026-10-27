import { expect, test } from "@playwright/test";
import { postJobsAsNewEmployer, registerSeeker, unique } from "./helpers";

test("a job seeker searches with filters and opens a job", async ({ page }) => {
  // Two jobs sharing a unique word, so the search finds exactly these.
  const token = unique("zq");
  const company = await postJobsAsNewEmployer([
    { title: `Junior Data Analyst ${token}`, type: "PART_TIME", location: "Moncton, NB" },
    { title: `Senior Data Engineer ${token}`, type: "FULL_TIME", location: "Fredericton, NB" },
  ]);
  await registerSeeker(page);
  await page.goto("/jobs");

  await page.getByLabel("Search jobs").fill(token);
  // The search reaches the URL (and the API) 300 ms after typing stops.
  await expect(page).toHaveURL(new RegExp(`q=${token}`));
  await expect(page.getByRole("heading", { name: `Junior Data Analyst ${token}` })).toBeVisible();
  await expect(page.getByRole("heading", { name: `Senior Data Engineer ${token}` })).toBeVisible();

  await page.getByLabel("Job type").selectOption("PART_TIME");
  await expect(page.getByRole("heading", { name: `Senior Data Engineer ${token}` })).toBeHidden();
  await expect(page).toHaveURL(/type=PART_TIME/);

  // Filters live in the URL, so they survive a reload.
  await page.reload();
  await expect(page.getByLabel("Search jobs")).toHaveValue(token);
  await expect(page.getByRole("link", { name: "Read More" })).toHaveCount(1);

  await page.getByRole("link", { name: "Read More" }).click();
  await expect(page).toHaveURL(/\/jobs\/[^/?]+$/);
  await expect(page.getByRole("heading", { name: `Junior Data Analyst ${token}` })).toBeVisible();
  await expect(page.getByText(company).first()).toBeVisible();
  await expect(page.getByText("Moncton, NB").first()).toBeVisible();
});

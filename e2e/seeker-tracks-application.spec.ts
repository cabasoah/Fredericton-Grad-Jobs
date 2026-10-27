import { expect, test } from "@playwright/test";
import { postJobsAsNewEmployer, registerSeeker, unique } from "./helpers";

test("a job seeker saves a job and drags it to Applied on the tracker", async ({ page }) => {
  const title = `Frontend Developer ${unique("fe")}`;
  const company = await postJobsAsNewEmployer([{ title, type: "FULL_TIME", location: "Saint John, NB" }]);
  await registerSeeker(page);
  await page.goto("/jobs");

  await page.getByLabel("Search jobs").fill(title);
  await expect(page.getByRole("link", { name: "Read More" })).toHaveCount(1);
  await page.getByRole("button", { name: `Save ${title} to your tracker` }).click();
  await expect(page.getByRole("link", { name: `Saved ${title} (open your tracker)` })).toBeVisible();

  await page.getByRole("navigation").getByRole("link", { name: "Tracker" }).click();
  const saved = page.getByRole("region", { name: /^Saved/ });
  const applied = page.getByRole("region", { name: /^Applied/ });
  await expect(saved.getByText(title)).toBeVisible();

  // Drag the card's grip into the Applied column with the mouse.
  const handle = page.getByRole("button", { name: `Move ${title} at ${company}` });
  const from = await handle.boundingBox();
  const to = await applied.boundingBox();
  if (!from || !to) throw new Error("board is not laid out");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + 120, { steps: 15 });
  await page.mouse.up();

  await expect(applied.getByText(title)).toBeVisible();
  await expect(saved.getByText(title)).toBeHidden();

  // The server kept it: still Applied after a reload, with the move in its history.
  await page.reload();
  await expect(applied.getByText(title)).toBeVisible();
  await applied.getByRole("button", { name: new RegExp(title) }).last().click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByText("Saved → Applied")).toBeVisible();
  await expect(panel.getByLabel("Stage", { exact: true })).toHaveValue("APPLIED");
});

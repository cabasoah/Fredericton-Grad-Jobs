import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Job } from "@fredericton-grad-jobs/shared";
import JobListing from "@/components/JobListing";
import { makeJob } from "@/test/fixtures";
import { renderRoutes } from "@/test/render";

const renderCard = (job: Job) => renderRoutes([{ path: "/", element: <JobListing job={job} /> }], "/");

// 26 letters repeated: easy to see where a cut happens.
const text = (length: number) => "abcdefghijklmnopqrstuvwxyz".repeat(30).slice(0, length);

describe("JobListing description", () => {
  it("shows a short description in full", async () => {
    renderCard(makeJob({ description: text(90) }));
    expect(await screen.findByText(text(90))).toBeInTheDocument();
  });

  it("cuts a long description at 90 characters; the job page has the rest", async () => {
    renderCard(makeJob({ description: text(600) }));
    expect(await screen.findByText(`${text(90)}...`)).toBeInTheDocument();
  });

  it("links the title to the job page", async () => {
    renderCard(makeJob({ id: "job-42", title: "Data Analyst" }));
    expect(await screen.findByRole("link", { name: "Data Analyst" })).toHaveAttribute("href", "/jobs/job-42");
  });

  it("previews imported HTML as plain text with blocks kept apart and scripts dropped", async () => {
    renderCard(
      makeJob({
        source: "GREENHOUSE",
        description: "<p>Join <strong>our</strong> team.</p><script>alert('x')</script><ul><li>SQL</li></ul>",
      }),
    );
    expect(await screen.findByText("Join our team. SQL")).toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("<strong>");
    expect(document.body.textContent).not.toContain("alert");
  });
});

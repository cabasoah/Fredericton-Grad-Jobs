import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Job } from "@fredericton-grad-jobs/shared";
import JobListing from "@/components/JobListing";
import { makeJob } from "@/test/fixtures";
import { renderRoutes } from "@/test/render";

const renderCard = (job: Job) => renderRoutes([{ path: "/", element: <JobListing job={job} /> }], "/");

// 26 letters repeated: easy to see where a cut happens.
const text = (length: number) => "abcdefghijklmnopqrstuvwxyz".repeat(30).slice(0, length);

describe("JobListing description", () => {
  it("shows a short description in full, with no More button", async () => {
    renderCard(makeJob({ description: text(90) }));
    expect(await screen.findByText(text(90))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "More" })).not.toBeInTheDocument();
  });

  it("cuts a long description at 90 characters and toggles a longer preview", async () => {
    const user = userEvent.setup();
    renderCard(makeJob({ description: text(600) }));

    expect(await screen.findByText(`${text(90)}...`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More" }));
    // Expanded cards stop at 500; the job page has the rest.
    expect(screen.getByText(`${text(500)}...`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Less" }));
    expect(screen.getByText(`${text(90)}...`)).toBeInTheDocument();
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

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import JobsPage from "@/pages/JobsPage";
import { makeJob } from "@/test/fixtures";
import { renderRoutes } from "@/test/render";
import { apiUrl, server } from "@/test/server";

// Answers GET /jobs and records the query string of every request.
const captureJobQueries = (jobs = [makeJob()]) => {
  const queries: URLSearchParams[] = [];
  server.use(
    http.get(apiUrl("/jobs"), ({ request }) => {
      queries.push(new URL(request.url).searchParams);
      return HttpResponse.json({ data: jobs, nextCursor: null });
    }),
  );
  return queries;
};

const renderJobs = (url = "/jobs") => renderRoutes([{ path: "/jobs", element: <JobsPage /> }], url);
const currentUrl = () => screen.getByTestId("location").textContent;

describe("Jobs page filters", () => {
  it("puts a chosen select filter in the URL at once and loads jobs with it", async () => {
    const queries = captureJobQueries();
    const user = userEvent.setup();
    renderJobs();
    await screen.findByRole("heading", { name: "Junior Developer" });

    await user.selectOptions(screen.getByLabelText("Job type"), "INTERNSHIP");
    expect(currentUrl()).toBe("/jobs?type=INTERNSHIP");
    await user.selectOptions(screen.getByLabelText("Sort by"), "salary_desc");
    expect(currentUrl()).toBe("/jobs?type=INTERNSHIP&sort=salary_desc");

    await waitFor(() => expect(queries.at(-1)?.get("sort")).toBe("salary_desc"));
    expect(queries.at(-1)?.get("type")).toBe("INTERNSHIP");
  });

  it("waits for typing to stop, then puts the trimmed text in the URL with one request", async () => {
    const queries = captureJobQueries();
    const user = userEvent.setup();
    renderJobs();
    await screen.findByRole("heading", { name: "Junior Developer" });

    await user.type(screen.getByLabelText("Search jobs"), "  react ");
    expect(currentUrl()).toBe("/jobs");

    await waitFor(() => expect(currentUrl()).toBe("/jobs?q=react"));
    await waitFor(() => expect(queries.at(-1)?.get("q")).toBe("react"));
    expect(queries.filter((query) => query.has("q")).map((query) => query.get("q"))).toEqual(["react"]);
  });

  it("fills the inputs and the request from a shared link", async () => {
    const queries = captureJobQueries();
    renderJobs("/jobs?q=analyst&type=PART_TIME&location=Moncton&tags=sql");

    await screen.findByRole("heading", { name: "Junior Developer" });
    expect(screen.getByLabelText("Search jobs")).toHaveValue("analyst");
    expect(screen.getByLabelText("Job type")).toHaveValue("PART_TIME");
    expect(screen.getByLabelText("Location")).toHaveValue("Moncton");
    expect(screen.getByLabelText("Tags")).toHaveValue("sql");
    expect(Object.fromEntries(queries[0] ?? [])).toMatchObject({
      q: "analyst",
      type: "PART_TIME",
      location: "Moncton",
      tags: "sql",
    });
  });

  it("clears every filter but keeps the sort order", async () => {
    const queries = captureJobQueries([]);
    const user = userEvent.setup();
    renderJobs("/jobs?q=nothing&type=CONTRACT&sort=salary_desc");

    await user.click(await screen.findByRole("button", { name: "Clear filters" }));
    const sentBeforeClear = queries.length;
    expect(currentUrl()).toBe("/jobs?sort=salary_desc");

    // The cleared search must not come back once the 300 ms debounce fires.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(currentUrl()).toBe("/jobs?sort=salary_desc");
    expect(queries.slice(sentBeforeClear).filter((query) => query.has("q"))).toEqual([]);
    expect(screen.getByLabelText("Search jobs")).toHaveValue("");
    expect(screen.getByLabelText("Job type")).toHaveValue("");
    expect(screen.getByLabelText("Sort by")).toHaveValue("salary_desc");
  });
});

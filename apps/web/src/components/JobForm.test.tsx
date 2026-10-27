import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import RequireRole from "@/components/RequireRole";
import AddJobPage from "@/pages/AddJobPage";
import { employer, makeJob } from "@/test/fixtures";
import { renderRoutes } from "@/test/render";
import { apiError, apiUrl, server, signedInAs } from "@/test/server";

const renderAddJob = () =>
  renderRoutes(
    [
      { path: "/add-job", element: <RequireRole role="EMPLOYER"><AddJobPage /></RequireRole> },
      { path: "/jobs/:id", element: <p>Job page</p> },
    ],
    "/add-job",
  );

// Records every POST /jobs body and answers with the created job.
const capturePosts = () => {
  const bodies: unknown[] = [];
  server.use(
    http.post(apiUrl("/jobs"), async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push(body);
      return HttpResponse.json(makeJob({ id: "job-new", title: String(body.title) }), { status: 201 });
    }),
  );
  return bodies;
};

const fillRequired = async (user: ReturnType<typeof userEvent.setup>, title = "Data Analyst") => {
  await user.type(await screen.findByLabelText("Job Listing Name"), title);
  await user.type(screen.getByLabelText("Description"), "Turn data into decisions.");
  await user.type(screen.getByLabelText("Location"), "Fredericton, NB");
};

describe("JobForm (Add Job page)", () => {
  it("shows every validation problem and sends nothing when the input is invalid", async () => {
    server.use(signedInAs(employer));
    const bodies = capturePosts();
    const user = userEvent.setup();
    renderAddJob();

    // Whitespace passes the browser's `required` check but not the schema.
    await fillRequired(user, "   ");
    await user.type(screen.getByLabelText("Minimum"), "90000");
    await user.type(screen.getByLabelText("Maximum"), "50000");
    await user.click(screen.getByRole("button", { name: "Add Job" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Please fix the following:");
    const problems = within(alert).getAllByRole("listitem").map((item) => item.textContent);
    expect(problems).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^title: /),
        "salaryMax: salaryMax must be greater than or equal to salaryMin",
      ]),
    );
    expect(screen.getByRole("button", { name: "Add Job" })).toBeEnabled();
    expect(bodies).toEqual([]);
  });

  it("posts the fields in the API's shape and opens the new job", async () => {
    server.use(signedInAs(employer));
    const bodies = capturePosts();
    const user = userEvent.setup();
    renderAddJob();

    await fillRequired(user);
    await user.selectOptions(screen.getByLabelText("Job Type"), "INTERNSHIP");
    await user.selectOptions(screen.getByLabelText("Work Arrangement"), "HYBRID");
    await user.type(screen.getByLabelText("Minimum"), "50000");
    await user.type(screen.getByLabelText("Maximum"), "60000");
    await user.type(screen.getByLabelText("Tags"), " sql, , python ");
    await user.type(screen.getByLabelText("Application Link"), "  https://acme.test/apply ");
    expect(screen.getByText("Acme")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Job" }));

    expect(await screen.findByTestId("location")).toHaveTextContent("/jobs/job-new");
    expect(bodies).toEqual([
      {
        title: "Data Analyst",
        description: "Turn data into decisions.",
        type: "INTERNSHIP",
        remote: "HYBRID",
        location: "Fredericton, NB",
        salaryMin: 50000,
        salaryMax: 60000,
        currency: "CAD",
        tags: ["sql", "python"],
        externalUrl: "https://acme.test/apply",
        status: "OPEN",
      },
    ]);
    expect(await screen.findByText('"Data Analyst" was posted.')).toBeInTheDocument();
  });

  it("shows the API's validation details and lets the user try again", async () => {
    server.use(
      signedInAs(employer),
      http.post(apiUrl("/jobs"), () =>
        apiError(400, "VALIDATION_ERROR", "Request validation failed", [
          { path: "location", message: "Location is not supported" },
        ]),
      ),
    );
    const user = userEvent.setup();
    renderAddJob();

    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Add Job" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Request validation failed");
    expect(within(alert).getByRole("listitem")).toHaveTextContent("location: Location is not supported");
    expect(screen.getByRole("button", { name: "Add Job" })).toBeEnabled();
    expect(screen.getByTestId("location")).toHaveTextContent("/add-job");
  });
});

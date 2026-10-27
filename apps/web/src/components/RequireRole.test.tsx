import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import RequireRole from "@/components/RequireRole";
import LoginPage from "@/pages/LoginPage";
import { employer, seeker } from "@/test/fixtures";
import { renderRoutes } from "@/test/render";
import { apiUrl, server, signedInAs } from "@/test/server";

const renderProtected = (url: string) =>
  renderRoutes(
    [
      { path: "/add-job", element: <RequireRole role="EMPLOYER"><h1>Post a job</h1></RequireRole> },
      { path: "/login", element: <LoginPage /> },
    ],
    url,
  );

describe("RequireRole", () => {
  it("sends a signed-out visitor to log in and back to the page they asked for", async () => {
    server.use(http.post(apiUrl("/auth/login"), () => HttpResponse.json({ user: employer })));
    const user = userEvent.setup();
    renderProtected("/add-job?draft=1");

    expect(await screen.findByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/login?returnTo=%2Fadd-job%3Fdraft%3D1");
    expect(screen.queryByRole("heading", { name: "Post a job" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), employer.email);
    await user.type(screen.getByLabelText("Password"), "a long enough password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("heading", { name: "Post a job" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/add-job?draft=1");
  });

  it("waits for the session check instead of redirecting a signed-in user", async () => {
    server.use(signedInAs(employer));
    renderProtected("/add-job");

    expect(screen.getByRole("status")).toHaveTextContent("Checking your account...");
    expect(await screen.findByRole("heading", { name: "Post a job" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/add-job");
  });

  it("tells a signed-in user with the wrong role that the page is not for them", async () => {
    server.use(signedInAs(seeker));
    renderProtected("/add-job");

    expect(await screen.findByText("This page is for employer accounts.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Post a job" })).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/add-job");
  });
});

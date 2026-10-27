import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Application } from "@fredericton-grad-jobs/shared";
import TrackerPage from "@/pages/TrackerPage";
import { makeApplication, seeker } from "@/test/fixtures";
import { renderRoutes } from "@/test/render";
import { apiError, apiUrl, server, signedInAs } from "@/test/server";

// jsdom does no layout, so every element measures 0x0 and dnd-kit finds no
// column to drop on. Give the board a simple geometry instead: columns
// 300 px apart, cards stacked inside them. Only layout is faked; the board,
// sensors, collision detection and mutation code all run for real.
const rect = (left: number, top: number, width: number, height: number) =>
  ({ x: left, y: top, left, top, width, height, right: left + width, bottom: top + height, toJSON: () => ({}) }) as DOMRect;

const fakeLayout = function (this: Element): DOMRect {
  const column = this.closest("section[aria-labelledby^=column-]");
  if (!column) {
    // The drag overlay (a fixed-position copy of the card) starts where the
    // dragged card is; dnd-kit adds the drag offset itself.
    const dragged = document.querySelector('[aria-pressed="true"]')?.closest("li");
    if (dragged && this.closest('[style*="position: fixed"]')) return fakeLayout.call(dragged);
    return rect(0, 0, 0, 0);
  }
  const columns = [...document.querySelectorAll("section[aria-labelledby^=column-]")];
  const left = columns.indexOf(column) * 300;
  const card = this.closest("li");
  if (!card) return rect(left, 0, 280, 600);
  const index = [...column.querySelectorAll("li")].indexOf(card);
  return rect(left + 10, 60 + index * 100, 260, 90);
};

beforeEach(() => {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(fakeLayout);
});
afterEach(() => {
  vi.restoreAllMocks();
});

const column = (label: string) => screen.getByRole("region", { name: new RegExp(`^${label}`) });

// A tiny in-memory API. PATCH waits for `release()` so the test can look at
// the board while the request is still in flight.
const fakeApi = ({ failPatch }: { failPatch: boolean }) => {
  let applications: Application[] = [makeApplication({ id: "app-1", roleTitle: "Data Analyst", companyName: "Acme" })];
  const patches: unknown[] = [];
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    signedInAs(seeker),
    http.get(apiUrl("/applications"), () => HttpResponse.json({ data: applications })),
    http.patch(apiUrl("/applications/:id"), async ({ request, params }) => {
      const body = (await request.json()) as Partial<Application>;
      patches.push(body);
      await gate;
      if (failPatch) return apiError(500, "INTERNAL_ERROR", "Internal server error");
      applications = applications.map((application) =>
        application.id === params.id ? { ...application, ...body } : application,
      );
      return HttpResponse.json({ ...applications[0], events: [] });
    }),
  );
  return { patches, release: () => release() };
};

// Keyboard drag: focus the grip, Space to pick up, Right to jump a column,
// Space to drop.
const moveRightWithKeyboard = async (user: ReturnType<typeof userEvent.setup>) => {
  screen.getByRole("button", { name: "Move Data Analyst at Acme" }).focus();
  await user.keyboard("[Space]");
  await user.keyboard("[ArrowRight]");
  await user.keyboard("[Space]");
};

describe("Kanban board stage changes", () => {
  it("moves the card at once and keeps it there when the server agrees", async () => {
    const api = fakeApi({ failPatch: false });
    const user = userEvent.setup();
    renderRoutes([{ path: "/tracker", element: <TrackerPage /> }], "/tracker");
    await within(await screen.findByRole("region", { name: /^Saved/ })).findByText("Data Analyst");

    await moveRightWithKeyboard(user);

    // Optimistic: already in Applied while the PATCH is still pending.
    await waitFor(() => expect(within(column("Applied")).getByText("Data Analyst")).toBeInTheDocument());
    expect(within(column("Saved")).queryByText("Data Analyst")).not.toBeInTheDocument();
    expect(api.patches).toEqual([{ stage: "APPLIED" }]);

    api.release();
    await waitFor(() => expect(api.patches).toHaveLength(1));
    // Still there after the server answered and the list was refetched.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(within(column("Applied")).getByText("Data Analyst")).toBeInTheDocument();
    expect(screen.queryByText(/It has been moved back/)).not.toBeInTheDocument();
  });

  it("moves the card back and says so when the server refuses", async () => {
    const api = fakeApi({ failPatch: true });
    const user = userEvent.setup();
    renderRoutes([{ path: "/tracker", element: <TrackerPage /> }], "/tracker");
    await within(await screen.findByRole("region", { name: /^Saved/ })).findByText("Data Analyst");

    await moveRightWithKeyboard(user);
    await waitFor(() => expect(within(column("Applied")).getByText("Data Analyst")).toBeInTheDocument());

    api.release();
    expect(
      await screen.findByText("Could not move to Applied (Internal server error). It has been moved back."),
    ).toBeInTheDocument();
    expect(within(column("Saved")).getByText("Data Analyst")).toBeInTheDocument();
    expect(within(column("Applied")).queryByText("Data Analyst")).not.toBeInTheDocument();
  });

  it("sends nothing when a keyboard drag is cancelled with Escape", async () => {
    const api = fakeApi({ failPatch: false });
    const user = userEvent.setup();
    renderRoutes([{ path: "/tracker", element: <TrackerPage /> }], "/tracker");
    await within(await screen.findByRole("region", { name: /^Saved/ })).findByText("Data Analyst");

    screen.getByRole("button", { name: "Move Data Analyst at Acme" }).focus();
    await user.keyboard("[Space]");
    await user.keyboard("[ArrowRight]");
    await user.keyboard("[Escape]");

    expect(within(column("Saved")).getByText("Data Analyst")).toBeInTheDocument();
    expect(api.patches).toEqual([]);
  });
});

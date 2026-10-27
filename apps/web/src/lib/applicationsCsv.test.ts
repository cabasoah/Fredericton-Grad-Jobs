import { describe, expect, it } from "vitest";
import type { Application } from "@fredericton-grad-jobs/shared";
import { applicationsToCsv } from "./applicationsCsv";

const application = (overrides: Partial<Application> = {}): Application => ({
  id: "a1",
  jobId: null,
  companyName: "Acme",
  roleTitle: "Junior Developer",
  url: "https://acme.example/jobs/1",
  stage: "APPLIED",
  appliedAt: "2026-10-20T12:00:00.000Z",
  nextFollowUpAt: null,
  notes: "",
  createdAt: "2026-10-19T15:00:00.000Z",
  updatedAt: "2026-10-21T15:00:00.000Z",
  ...overrides,
});

describe("applicationsToCsv", () => {
  it("writes a header row and one row per application", () => {
    expect(applicationsToCsv([application()])).toBe(
      "Company,Role,Stage,Applied,Next follow-up,URL,Notes,Added,Last updated\r\n" +
        "Acme,Junior Developer,Applied,2026-10-20,,https://acme.example/jobs/1,,2026-10-19,2026-10-21\r\n",
    );
  });

  it("quotes commas, quotes and line breaks", () => {
    const csv = applicationsToCsv([
      application({ companyName: "Smith, Jones & Co", notes: 'Said "great fit"\nFollow up Friday' }),
    ]);
    expect(csv).toContain('"Smith, Jones & Co"');
    expect(csv).toContain('"Said ""great fit""\nFollow up Friday"');
  });

  it("neutralises values a spreadsheet would run as formulas", () => {
    const csv = applicationsToCsv([application({ notes: "=HYPERLINK(\"http://evil\")", roleTitle: "+1 role" })]);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"")"`);
    expect(csv).toContain("'+1 role");
  });

  it("writes only the header for no applications", () => {
    expect(applicationsToCsv([])).toBe("Company,Role,Stage,Applied,Next follow-up,URL,Notes,Added,Last updated\r\n");
  });
});

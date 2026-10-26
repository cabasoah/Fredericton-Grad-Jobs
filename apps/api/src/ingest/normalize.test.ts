import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeGreenhouseJob } from "./sources/greenhouse";
import { normalizeLeverPosting } from "./sources/lever";
import { EMPTY_DESCRIPTION } from "./types";

// Real responses saved on 2026-10-26:
// greenhouse.json: boards-api.greenhouse.io hootsuite jobs?content=true (2 jobs),
//   plus one Faire job with Employment Type "Intern" and one Coinbase job
//   located "Remote - USA" (both fetched without content=true).
// lever.json: api.lever.co postings: Fullscript (hybrid and remote) and a
//   Palantir internship.
const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8"));

const greenhouseJobs = (fixture("greenhouse.json") as { jobs: unknown[] }).jobs;
const leverPostings = fixture("lever.json") as unknown[];

const greenhouseAt = (index: number) => normalizeGreenhouseJob(greenhouseJobs[index]);
const leverAt = (index: number) => normalizeLeverPosting(leverPostings[index]);

describe("normalizeGreenhouseJob (real Greenhouse responses)", () => {
  it("maps the identifying fields and converts first_published to UTC", () => {
    expect(greenhouseAt(0)).toMatchObject({
      externalId: "8221711",
      title: "Account Executive, Enterprise Sales (Spanish and Portuguese Speaking)",
      // The API returns "Mexico City " with a trailing space.
      location: "Mexico City",
      remote: "ONSITE",
      type: "FULL_TIME",
      externalUrl: "https://job-boards.greenhouse.io/hootsuite/jobs/8221711",
      postedAt: new Date("2026-09-22T17:05:31.000Z"),
    });
  });

  it("decodes the entity-escaped content and keeps only safe HTML", () => {
    const { description } = greenhouseAt(0);
    expect(description.startsWith("<p><em><strong>Please submit your resume in English")).toBe(true);
    expect(description).not.toContain("&lt;");
    expect(description).not.toMatch(/<(script|style|iframe|img|div|span)\b/i);
    expect(description).not.toMatch(/\s(style|class|on\w+)=/i);
  });

  it("uses the Employment Type field when present", () => {
    expect(greenhouseAt(2)).toMatchObject({
      externalId: "8870975002",
      title: "Applied AI/ML Scientist, Intern - Winter 2027",
      type: "INTERNSHIP",
    });
  });

  it("infers REMOTE from the location text", () => {
    expect(greenhouseAt(3)).toMatchObject({ location: "Remote - USA", remote: "REMOTE", type: "FULL_TIME" });
  });

  it("falls back to a placeholder when the posting has no content", () => {
    expect(greenhouseAt(3).description).toBe(EMPTY_DESCRIPTION);
  });

  it("rejects postings without the required fields", () => {
    expect(() => normalizeGreenhouseJob({ title: "No id or URL" })).toThrow();
  });
});

describe("normalizeLeverPosting (real Lever responses)", () => {
  it("maps the identifying fields and converts createdAt from epoch milliseconds", () => {
    expect(leverAt(0)).toMatchObject({
      externalId: "e574446e-9c0c-48b7-8c90-4c70df257a71",
      title: "Accounting Manager",
      location: "Ottawa, ON",
      remote: "HYBRID",
      type: "FULL_TIME",
      externalUrl: "https://jobs.lever.co/fullscript/e574446e-9c0c-48b7-8c90-4c70df257a71",
      postedAt: new Date(1792430096611),
    });
  });

  it("uses workplaceType over the location text", () => {
    // Located "Ottawa, ON" but workplaceType is "remote".
    expect(leverAt(1)).toMatchObject({ location: "Ottawa, ON", remote: "REMOTE" });
  });

  it("maps the Internship commitment", () => {
    expect(leverAt(2)).toMatchObject({ title: "Deployment Strategist, Internship", type: "INTERNSHIP", remote: "ONSITE" });
  });

  it("includes the titled lists as headings and keeps only safe HTML", () => {
    // Fullscript's remote posting has three lists ("What You'll Do", ...).
    const raw = leverPostings[1] as { lists: { text: string }[] };
    const { description } = leverAt(1);
    expect(raw.lists.length).toBeGreaterThan(0);
    for (const list of raw.lists) expect(description).toContain(`<h3>${list.text}</h3>`);
    expect(description).not.toMatch(/<(script|style|iframe|img|div|span)\b/i);
    expect(description).not.toMatch(/\s(style|class|on\w+)=/i);
  });
});

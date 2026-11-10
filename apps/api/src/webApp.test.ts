import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "./testApp";

// A stand-in for apps/web/dist; none of these requests reach the database.
let webDistDir: string;

beforeAll(() => {
  webDistDir = mkdtempSync(path.join(tmpdir(), "web-dist-"));
  mkdirSync(path.join(webDistDir, "assets"));
  writeFileSync(path.join(webDistDir, "index.html"), "<!doctype html><title>app</title>");
  writeFileSync(path.join(webDistDir, "assets", "index-abc123.js"), "console.log(1);");
  writeFileSync(path.join(webDistDir, "logo.png"), "png");
});

afterAll(() => {
  rmSync(webDistDir, { recursive: true, force: true });
});

describe("serving the web app (webDistDir)", () => {
  it("serves index.html at / and at client-side routes, revalidated on every load", async () => {
    const app = createTestApp({ webDistDir });
    for (const url of ["/", "/tracker", "/jobs/abc123"]) {
      const res = await request(app).get(url);
      expect(res.status, url).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/html/);
      expect(res.headers["cache-control"]).toBe("no-cache");
      expect(res.text).toContain("<title>app</title>");
    }
  });

  it("serves hashed assets as immutable and other files with no-cache", async () => {
    const app = createTestApp({ webDistDir });
    const asset = await request(app).get("/assets/index-abc123.js");
    expect(asset.status).toBe(200);
    expect(asset.headers["cache-control"]).toBe("public, max-age=31536000, immutable");

    const logo = await request(app).get("/logo.png");
    expect(logo.status).toBe(200);
    expect(logo.headers["cache-control"]).toBe("no-cache");
  });

  it("returns the JSON 404 for unknown API and asset paths and for non-GET pages", async () => {
    const app = createTestApp({ webDistDir });
    for (const [method, url] of [
      ["get", "/api/v1/nope"],
      ["get", "/api"],
      ["get", "/assets/missing.js"],
      ["post", "/tracker"],
    ] as const) {
      const res = await request(app)[method](url);
      expect(res.status, `${method} ${url}`).toBe(404);
      expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
    }
  });

  it("serves no web app when webDistDir is unset", async () => {
    const res = await request(createTestApp()).get("/");
    expect(res.status).toBe(404);
  });
});

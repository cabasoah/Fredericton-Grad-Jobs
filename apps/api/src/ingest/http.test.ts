import { describe, expect, it } from "vitest";
import { fetchJson, IngestFetchError, USER_AGENT, type HttpOptions } from "./http";

const response = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Records each call and each backoff delay instead of waiting.
const harness = (results: (Response | Error)[]) => {
  const calls: RequestInit[] = [];
  const waits: number[] = [];
  const options: HttpOptions = {
    timeoutMs: 1000,
    retries: 3,
    baseDelayMs: 100,
    sleep: (ms) => {
      waits.push(ms);
      return Promise.resolve();
    },
    fetchImpl: (_url, init) => {
      calls.push(init ?? {});
      const next = results.shift();
      if (!next) throw new Error("no more results");
      return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
    },
  };
  return { options, calls, waits };
};

describe("fetchJson", () => {
  it("retries 5xx and network errors with exponential backoff, then succeeds", async () => {
    const { options, calls, waits } = harness([response(503), new TypeError("fetch failed"), response(200, { ok: 1 })]);
    await expect(fetchJson("https://example.test", options)).resolves.toEqual({ ok: 1 });
    expect(calls).toHaveLength(3);
    // 100 * 2^0 and 100 * 2^1, each plus 0-249 ms of jitter.
    expect(waits[0]).toBeGreaterThanOrEqual(100);
    expect(waits[0]).toBeLessThan(350);
    expect(waits[1]).toBeGreaterThanOrEqual(200);
    expect(waits[1]).toBeLessThan(450);
  });

  it("does not retry a 404", async () => {
    const { options, calls } = harness([response(404)]);
    await expect(fetchJson("https://example.test", options)).rejects.toMatchObject({ status: 404, retryable: false });
    expect(calls).toHaveLength(1);
  });

  it("gives up after the configured retries", async () => {
    const { options, calls } = harness([response(500), response(502), response(503), response(504)]);
    const error = await fetchJson("https://example.test", options).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(IngestFetchError);
    expect(calls).toHaveLength(4);
  });

  it("sends the project User-Agent and a timeout signal", async () => {
    const { options, calls } = harness([response(200)]);
    await fetchJson("https://example.test", options);
    expect(new Headers(calls[0]?.headers).get("User-Agent")).toBe(USER_AGENT);
    expect(USER_AGENT).not.toMatch(/@/);
    expect(calls[0]?.signal).toBeInstanceOf(AbortSignal);
  });
});

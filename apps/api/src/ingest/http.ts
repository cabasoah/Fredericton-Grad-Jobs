// Identifies the project to job boards. No personal contact details.
export const USER_AGENT =
  "FrederictonGradJobs/0.1 (+https://github.com/cabasoah/React-Job-Application)";

export type HttpOptions = {
  timeoutMs: number;
  // Extra attempts after the first one.
  retries: number;
  // Wait before retry n is baseDelayMs * 2^n plus up to 250 ms of jitter.
  baseDelayMs: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

export const DEFAULT_HTTP_OPTIONS: HttpOptions = { timeoutMs: 15_000, retries: 3, baseDelayMs: 1_000 };

export class IngestFetchError extends Error {
  readonly status: number | undefined;
  readonly retryable: boolean;

  constructor(message: string, status: number | undefined, retryable: boolean) {
    super(message);
    this.name = "IngestFetchError";
    this.status = status;
    this.retryable = retryable;
  }
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// GET a JSON document. Retries 5xx, 429 and network/timeout errors with
// exponential backoff; other 4xx responses (e.g. an unknown board) fail
// immediately.
export const fetchJson = async (url: string, options: HttpOptions = DEFAULT_HTTP_OPTIONS): Promise<unknown> => {
  const { timeoutMs, retries, baseDelayMs, fetchImpl = fetch, sleep: wait = sleep } = options;

  for (let attempt = 0; ; attempt++) {
    let failure: IngestFetchError;
    try {
      const res = await fetchImpl(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        const body: unknown = await res.json();
        return body;
      }
      const retryable = res.status >= 500 || res.status === 429;
      failure = new IngestFetchError(`GET ${url} returned ${res.status}`, res.status, retryable);
    } catch (err) {
      // fetch rejects on network errors and on the timeout's AbortSignal.
      const reason = err instanceof Error ? err.message : String(err);
      failure = new IngestFetchError(`GET ${url} failed: ${reason}`, undefined, true);
    }

    if (!failure.retryable || attempt >= retries) throw failure;
    await wait(baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 250));
  }
};

import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

// One client for the app; the router's loaders use it too, so data they
// load is already cached when the page renders.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry network and 5xx errors twice, never 4xx (they will not change).
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
});

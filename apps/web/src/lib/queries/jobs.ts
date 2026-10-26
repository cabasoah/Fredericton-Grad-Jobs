import {
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import type { Job, JobCreateInput, JobListResponse, JobUpdate } from "@fredericton-grad-jobs/shared";
import { api, ApiError, type JobFilters } from "@/lib/api";
import { useToast } from "@/toast/ToastContext";

// Query keys: ["jobs", "list", {filters, limit}] and ["jobs", "detail", id].
// Invalidating ["jobs", "list"] refreshes every list, whatever its filters.
export const jobKeys = {
  all: ["jobs"] as const,
  lists: () => [...jobKeys.all, "list"] as const,
  list: (filters: JobFilters, limit: number) => [...jobKeys.lists(), { filters, limit }] as const,
  details: () => [...jobKeys.all, "detail"] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

export const jobQueryOptions = (id: string) =>
  queryOptions({ queryKey: jobKeys.detail(id), queryFn: () => api.getJob(id) });

type JobPages = InfiniteData<JobListResponse, string | undefined>;

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

// Cursor-paginated job list; fetchNextPage loads the next page.
export const useJobs = (filters: JobFilters, limit: number) =>
  useInfiniteQuery({
    queryKey: jobKeys.list(filters, limit),
    queryFn: ({ pageParam }) => api.listJobs(filters, limit, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

// The route loader has already put the job in the cache, so this never
// suspends on first render; a later failed refetch reaches the errorElement.
export const useJob = (id: string) => useSuspenseQuery(jobQueryOptions(id));

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: JobCreateInput) => api.createJob(input),
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job);
      showToast("success", `"${job.title}" was posted.`);
      return queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
    onError: (err) => showToast("error", errorMessage(err, "Could not post the job.")),
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: JobUpdate }) => api.updateJob(id, input),
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job);
      showToast("success", `"${job.title}" was updated.`);
      return queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
    onError: (err) => showToast("error", errorMessage(err, "Could not update the job.")),
  });
};

// Optimistic: the job disappears from every cached list at once, and is put
// back if the API call fails.
export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (job: Job) => api.deleteJob(job.id),
    onMutate: async (job) => {
      // Stop in-flight list fetches from overwriting the optimistic update.
      await queryClient.cancelQueries({ queryKey: jobKeys.lists() });
      const previousLists = queryClient.getQueriesData<JobPages>({ queryKey: jobKeys.lists() });
      queryClient.setQueriesData<JobPages>({ queryKey: jobKeys.lists() }, (old) =>
        old && {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((listed) => listed.id !== job.id),
          })),
        },
      );
      return { previousLists };
    },
    onError: (err, job, context) => {
      for (const [queryKey, data] of context?.previousLists ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
      // The job reappears in the list, so say why.
      showToast(
        "error",
        `Could not delete "${job.title}" (${errorMessage(err, "network error")}). It has been restored.`,
      );
    },
    onSuccess: (_result, job) => {
      queryClient.removeQueries({ queryKey: jobKeys.detail(job.id) });
      showToast("success", `"${job.title}" was deleted.`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: jobKeys.lists() }),
  });
};

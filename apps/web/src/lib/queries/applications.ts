import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  APPLICATION_STAGE_LABELS,
  type Application,
  type ApplicationCreateInput,
  type ApplicationStage,
  type ApplicationUpdate,
} from "@fredericton-grad-jobs/shared";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/toast/ToastContext";

// ["applications", "list"], ["applications", "detail", id], ["applications", "stats"]
export const applicationKeys = {
  all: ["applications"] as const,
  list: () => [...applicationKeys.all, "list"] as const,
  detail: (id: string) => [...applicationKeys.all, "detail", id] as const,
  stats: () => [...applicationKeys.all, "stats"] as const,
};

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

// The signed-in seeker's applications. Pass enabled=false for anyone else
// (the API returns 401/403 for them).
export const useApplications = (enabled = true) =>
  useQuery({ queryKey: applicationKeys.list(), queryFn: () => api.listApplications(), enabled });

export const useApplication = (id: string | null) =>
  useQuery({
    queryKey: applicationKeys.detail(id ?? ""),
    queryFn: () => api.getApplication(id ?? ""),
    enabled: id !== null,
  });

export const useApplicationStats = () =>
  useQuery({ queryKey: applicationKeys.stats(), queryFn: () => api.getApplicationStats() });

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: ApplicationCreateInput) => api.createApplication(input),
    onSuccess: (application) => {
      queryClient.setQueryData<Application[]>(applicationKeys.list(), (old) => (old ? [application, ...old] : old));
      showToast(
        "success",
        application.stage === "SAVED"
          ? `Saved "${application.roleTitle}" to your tracker.`
          : `Added "${application.roleTitle}" to your tracker.`,
      );
      return queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
    onError: (err) => showToast("error", errorMessage(err, "Could not add the application.")),
  });
};

// Optimistic: the card moves (or the edit shows) at once and is rolled
// back if the API refuses.
export const useUpdateApplication = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ApplicationUpdate }) => api.updateApplication(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: applicationKeys.list() });
      const previous = queryClient.getQueryData<Application[]>(applicationKeys.list());
      if (input.stage) {
        const stage: ApplicationStage = input.stage;
        queryClient.setQueryData<Application[]>(applicationKeys.list(), (old) =>
          old?.map((application) => (application.id === id ? { ...application, stage } : application)),
        );
      }
      return { previous };
    },
    onError: (err, { input }, context) => {
      if (context?.previous) queryClient.setQueryData(applicationKeys.list(), context.previous);
      showToast(
        "error",
        input.stage
          ? `Could not move to ${APPLICATION_STAGE_LABELS[input.stage]} (${errorMessage(err, "network error")}). It has been moved back.`
          : errorMessage(err, "Could not save your changes."),
      );
    },
    onSuccess: (application) => {
      queryClient.setQueryData(applicationKeys.detail(application.id), application);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (application: Application) => api.deleteApplication(application.id),
    onSuccess: (_result, application) => {
      queryClient.setQueryData<Application[]>(applicationKeys.list(), (old) =>
        old?.filter((listed) => listed.id !== application.id),
      );
      queryClient.removeQueries({ queryKey: applicationKeys.detail(application.id) });
      showToast("success", `Removed "${application.roleTitle}" from your tracker.`);
      return queryClient.invalidateQueries({ queryKey: applicationKeys.stats() });
    },
    onError: (err) => showToast("error", errorMessage(err, "Could not remove the application.")),
  });
};

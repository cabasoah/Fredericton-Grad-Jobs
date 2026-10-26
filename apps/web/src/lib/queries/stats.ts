import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const statsKey = ["stats"] as const;

export const useStats = () => useQuery({ queryKey: statsKey, queryFn: () => api.getStats() });

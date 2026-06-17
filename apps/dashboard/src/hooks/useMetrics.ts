import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { MetricsData } from "../types";

export function useMetrics() {
  return useQuery<MetricsData>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const result = await api.get<MetricsData>("/metrics");
      return result.data;
    },
    refetchInterval: 90000, // Refresh metrics every 90 seconds for standard dashboard interval
  });
}

import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Delivery } from "../types";

export function useDeliveries(eventId?: string) {
  const deliveriesQuery = useQuery<Delivery[]>({
    queryKey: ["deliveries"],
    queryFn: async () => {
      const result = await api.get<Delivery[]>("/deliveries");
      return result.data;
    },
    enabled: !eventId,
  });

  const timelineQuery = useQuery<Delivery[]>({
    queryKey: ["deliveries", "timeline", eventId],
    queryFn: async () => {
      const result = await api.get<Delivery[]>(`/events/${eventId}/timeline`);
      return result.data;
    },
    enabled: !!eventId,
  });

  return {
    deliveries: deliveriesQuery.data,
    isLoadingDeliveries: deliveriesQuery.isLoading,
    timeline: timelineQuery.data,
    isLoadingTimeline: timelineQuery.isLoading,
  };
}

import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Delivery, PaginatedResponse } from "../types";

export function useDeliveries(
  pageOrEventId: number | string = 1,
  limit = 20,
  maybeEventId?: string,
) {
  const isTimelineQuery = typeof pageOrEventId === "string";
  const eventId = isTimelineQuery ? pageOrEventId : maybeEventId;
  const page = isTimelineQuery ? 1 : (pageOrEventId as number);

  const deliveriesQuery = useQuery<PaginatedResponse<Delivery> | Delivery[]>({
    queryKey: ["deliveries", page, limit],
    queryFn: async () => {
      const result = await api.get<PaginatedResponse<Delivery> | Delivery[]>("/deliveries", {
        params: { page, limit },
      });
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

  const deliveries = deliveriesQuery.data
    ? (Array.isArray(deliveriesQuery.data)
      ? deliveriesQuery.data
      : (deliveriesQuery.data.data || []))
    : [];

  return {
    deliveriesData: deliveriesQuery.data,
    deliveries,
    isLoadingDeliveries: deliveriesQuery.isLoading,
    timeline: timelineQuery.data,
    isLoadingTimeline: timelineQuery.isLoading,
  };
}

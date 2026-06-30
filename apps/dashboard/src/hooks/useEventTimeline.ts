import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Delivery } from "../types";

export function useEventTimeline(eventId: string | null) {
  const timelineQuery = useQuery<Delivery[]>({
    queryKey: ["event-timeline", eventId],
    queryFn: async () => {
      const result = await api.get<Delivery[]>(`/events/${eventId}/timeline`);
      return result.data;
    },
    enabled: !!eventId,
  });

  return {
    timeline: timelineQuery.data ?? [],
    isLoading: timelineQuery.isLoading,
    error: timelineQuery.error,
  };
}

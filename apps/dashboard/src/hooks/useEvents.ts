import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Event, PaginatedResponse } from "../types";

export function useEvents(page = 1, limit = 20, deadPage = 1, poisonedPage = 1) {
  const queryClient = useQueryClient();

  const eventsQuery = useQuery<PaginatedResponse<Event> | Event[]>({
    queryKey: ["events", page, limit],
    queryFn: async () => {
      const result = await api.get<PaginatedResponse<Event> | Event[]>("/events", {
        params: { page, limit },
      });
      return result.data;
    },
  });

  const deadEventsQuery = useQuery<PaginatedResponse<Event>>({
    queryKey: ["events", "dead", deadPage, limit],
    queryFn: async () => {
      const result = await api.get<PaginatedResponse<Event>>("/events/dead", {
        params: { page: deadPage, limit },
      });
      return result.data;
    },
  });

  const poisonedEventsQuery = useQuery<PaginatedResponse<Event>>({
    queryKey: ["events", "poisoned", poisonedPage, limit],
    queryFn: async () => {
      const result = await api.get<PaginatedResponse<Event>>("/events/poisoned", {
        params: { page: poisonedPage, limit },
      });
      return result.data;
    },
  });

  const replayMutation = useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id: string) => {
      const result = await api.post<{ success: boolean }>(`/events/${id}/replay`);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });

  const replayAllMutation = useMutation<{ success: boolean }, Error, void>({
    mutationFn: async () => {
      const result = await api.post<{ success: boolean }>("/events/replay-all");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });

  const replayWindowMutation = useMutation<
    { success: boolean },
    Error,
    { from: string; to: string }
  >({
    mutationFn: async ({ from, to }) => {
      const result = await api.post<{ success: boolean }>("/events/replay-window", { from, to });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });

  return {
    eventsData: eventsQuery.data,
    isLoadingEvents: eventsQuery.isLoading,
    deadEvents: deadEventsQuery.data,
    isLoadingDead: deadEventsQuery.isLoading,
    poisonedEvents: poisonedEventsQuery.data,
    isLoadingPoisoned: poisonedEventsQuery.isLoading,
    replayEvent: replayMutation.mutateAsync,
    isReplaying: replayMutation.isPending,
    replayAllEvents: replayAllMutation.mutateAsync,
    isReplayingAll: replayAllMutation.isPending,
    replayWindow: replayWindowMutation.mutateAsync,
    isReplayingWindow: replayWindowMutation.isPending,
  };
}

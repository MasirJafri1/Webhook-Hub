import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Webhook } from "../types";

export function useWebhooks() {
  const queryClient = useQueryClient();

  const webhooksQuery = useQuery<Webhook[]>({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const result = await api.get<Webhook[]>("/webhooks");
      return result.data;
    },
  });

  const createMutation = useMutation<
    Webhook,
    Error,
    {
      name: string;
      url: string;
      requestsPerMinute?: number;
      eventFilters?: string[];
      customHeaders?: Record<string, string>;
      version?: "v1" | "v2";
    }
  >({
    mutationFn: async (payload) => {
      const result = await api.post<Webhook>("/webhooks", payload);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });

  const deleteMutation = useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id) => {
      const result = await api.delete<{ success: boolean }>(`/webhooks/${id}`);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });

  const rotateSecretMutation = useMutation<{ secret: string }, Error, string>({
    mutationFn: async (id) => {
      const result = await api.post<{ secret: string }>(`/webhooks/${id}/rotate-secret`);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });

  return {
    data: webhooksQuery.data,
    isLoading: webhooksQuery.isLoading,
    error: webhooksQuery.error,
    createWebhook: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteWebhook: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    rotateSecret: rotateSecretMutation.mutateAsync,
    isRotating: rotateSecretMutation.isPending,
  };
}

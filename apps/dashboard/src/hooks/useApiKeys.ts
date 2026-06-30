import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { ApiKey } from "../types";

export function useApiKeys() {
  const queryClient = useQueryClient();

  const apiKeysQuery = useQuery<ApiKey[]>({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const result = await api.get<ApiKey[]>("/api-keys");
      return result.data;
    },
  });

  const createMutation = useMutation<
    { id: string; name: string; key: string },
    Error,
    { name: string }
  >({
    mutationFn: async (payload) => {
      const result = await api.post<{ id: string; name: string; key: string }>(
        "/api-keys",
        { ...payload, projectId: "__auto__" }, // backend uses request.projectId from JWT
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const deleteMutation = useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id) => {
      const result = await api.delete<{ success: boolean }>(`/api-keys/${id}`);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  return {
    apiKeys: apiKeysQuery.data ?? [],
    isLoading: apiKeysQuery.isLoading,
    error: apiKeysQuery.error,
    createApiKey: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteApiKey: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

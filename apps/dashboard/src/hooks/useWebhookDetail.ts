import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Webhook, WebhookMetrics, WebhookSigningInfo } from "../types";

export function useWebhookDetail(webhookId: string | null) {
  const detailQuery = useQuery<Webhook>({
    queryKey: ["webhook-detail", webhookId],
    queryFn: async () => {
      const result = await api.get<Webhook>(`/webhooks/${webhookId}`);
      return result.data;
    },
    enabled: !!webhookId,
  });

  const metricsQuery = useQuery<WebhookMetrics>({
    queryKey: ["webhook-metrics", webhookId],
    queryFn: async () => {
      const result = await api.get<WebhookMetrics>(`/webhooks/${webhookId}/metrics`);
      return result.data;
    },
    enabled: !!webhookId,
  });

  const signingInfoQuery = useQuery<WebhookSigningInfo>({
    queryKey: ["webhook-signing-info", webhookId],
    queryFn: async () => {
      const result = await api.get<WebhookSigningInfo>(`/webhooks/${webhookId}/signing-info`);
      return result.data;
    },
    enabled: !!webhookId,
  });

  return {
    webhook: detailQuery.data,
    isLoadingDetail: detailQuery.isLoading,
    metrics: metricsQuery.data,
    isLoadingMetrics: metricsQuery.isLoading,
    signingInfo: signingInfoQuery.data,
    isLoadingSigningInfo: signingInfoQuery.isLoading,
  };
}

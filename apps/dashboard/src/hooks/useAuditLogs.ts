import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { AuditLog } from "../types";

export function useAuditLogs() {
  const auditLogsQuery = useQuery<AuditLog[]>({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const result = await api.get<AuditLog[]>("/audit-logs");
      return result.data;
    },
  });

  return {
    auditLogs: auditLogsQuery.data ?? [],
    isLoading: auditLogsQuery.isLoading,
    error: auditLogsQuery.error,
  };
}

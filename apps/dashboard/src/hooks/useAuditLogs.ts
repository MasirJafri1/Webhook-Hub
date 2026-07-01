import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { AuditLog, PaginatedResponse } from "../types";

export function useAuditLogs(page = 1, limit = 20) {
  const auditLogsQuery = useQuery<PaginatedResponse<AuditLog> | AuditLog[]>({
    queryKey: ["audit-logs", page, limit],
    queryFn: async () => {
      const result = await api.get<PaginatedResponse<AuditLog> | AuditLog[]>("/audit-logs", {
        params: { page, limit },
      });
      return result.data;
    },
  });

  const auditLogsList = auditLogsQuery.data
    ? (Array.isArray(auditLogsQuery.data)
      ? auditLogsQuery.data
      : (auditLogsQuery.data.data || []))
    : [];

  return {
    auditLogsData: auditLogsQuery.data,
    auditLogs: auditLogsList,
    isLoading: auditLogsQuery.isLoading,
    error: auditLogsQuery.error,
  };
}

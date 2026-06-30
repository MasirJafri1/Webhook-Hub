import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export interface UserMe {
  id: string;
  email: string;
  role: string;
  memberships: {
    id: string;
    organizationId: string;
    email: string;
    role: string;
  }[];
  activeProjectId: string | null;
  activeProject: {
    id: string;
    organizationId: string;
    name: string;
  } | null;
  activeOrgId: string | null;
  activeRole: string;
}

export function useAuthMe() {
  const queryClient = useQueryClient();

  const query = useQuery<UserMe>({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await api.get<UserMe>("/auth/me");
      const data = res.data;

      // Keep localStorage synchronized
      if (data.activeProjectId) {
        localStorage.setItem("whpk_project_id", data.activeProjectId);
      }
      if (data.activeOrgId) {
        localStorage.setItem("whpk_org_id", data.activeOrgId);
      }
      if (data.activeRole) {
        localStorage.setItem("whpk_member_role", data.activeRole);
      }
      localStorage.setItem("whpk_user_role", data.role);

      return data;
    },
    staleTime: 60000, // 1 minute
  });

  const switchProject = (projectId: string, orgId?: string) => {
    localStorage.setItem("whpk_project_id", projectId);
    if (orgId) {
      localStorage.setItem("whpk_org_id", orgId);
    } else {
      localStorage.removeItem("whpk_org_id");
    }
    // Clear query cache to reload with new active project header
    queryClient.clear();
    window.location.reload();
  };

  return {
    user: query.data,
    isLoading: query.isLoading,
    error: query.error,
    switchProject,
    refetch: query.refetch,
    // Role checks
    isAdmin: query.data?.activeRole === "admin" || localStorage.getItem("whpk_user_role") === "super_admin",
    isDeveloper: query.data?.activeRole === "developer" || query.data?.activeRole === "member",
    activeRole: query.data?.activeRole || localStorage.getItem("whpk_member_role") || "member",
  };
}

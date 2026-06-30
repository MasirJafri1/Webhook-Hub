import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Organization, Project, Member } from "../types";

export function useWorkspace() {
  const queryClient = useQueryClient();

  const orgsQuery = useQuery<Organization[]>({
    queryKey: ["organizations"],
    queryFn: async () => {
      const result = await api.get<Organization[]>("/orgs");
      return result.data;
    },
  });

  const projectsQuery = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const result = await api.get<Project[]>("/projects");
      return result.data;
    },
  });

  const createOrgMutation = useMutation<Organization, Error, { name: string }>({
    mutationFn: async (payload) => {
      const result = await api.post<Organization>("/orgs", payload);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  const createProjectMutation = useMutation<
    Project,
    Error,
    { name: string; organizationId: string; monthlyEventLimit?: number; retentionDays?: number }
  >({
    mutationFn: async (payload) => {
      const result = await api.post<Project>("/projects", payload);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const addMemberMutation = useMutation<
    Member,
    Error,
    { organizationId: string; email: string; role: string }
  >({
    mutationFn: async (payload) => {
      const result = await api.post<Member>("/members", payload);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

  return {
    orgs: orgsQuery.data ?? [],
    isLoadingOrgs: orgsQuery.isLoading,
    projects: projectsQuery.data ?? [],
    isLoadingProjects: projectsQuery.isLoading,
    createOrg: createOrgMutation.mutateAsync,
    isCreatingOrg: createOrgMutation.isPending,
    createProject: createProjectMutation.mutateAsync,
    isCreatingProject: createProjectMutation.isPending,
    addMember: addMemberMutation.mutateAsync,
    isAddingMember: addMemberMutation.isPending,
  };
}

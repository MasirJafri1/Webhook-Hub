import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Organization, Project, Member } from "../types";

export function useWorkspace(orgIdForMembers?: string) {
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

  const membersQuery = useQuery<any[]>({
    queryKey: ["members", orgIdForMembers],
    queryFn: async () => {
      if (!orgIdForMembers) return [];
      const result = await api.get<any[]>(`/members?organizationId=${orgIdForMembers}`);
      return result.data;
    },
    enabled: !!orgIdForMembers,
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

  const invitationsQuery = useQuery<any[]>({
    queryKey: ["invitations"],
    queryFn: async () => {
      const result = await api.get<any[]>("/invitations");
      return result.data;
    },
  });

  const acceptInvitationMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.post(`/invitations/${id}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
    },
  });

  const declineInvitationMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.post(`/invitations/${id}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });



  const deleteOrgMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/orgs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
    },
  });

  const deleteMemberMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
    },
  });

  return {
    orgs: orgsQuery.data ?? [],
    isLoadingOrgs: orgsQuery.isLoading,
    projects: projectsQuery.data ?? [],
    isLoadingProjects: projectsQuery.isLoading,
    invitations: invitationsQuery.data ?? [],
    isLoadingInvitations: invitationsQuery.isLoading,
    createOrg: createOrgMutation.mutateAsync,
    isCreatingOrg: createOrgMutation.isPending,
    createProject: createProjectMutation.mutateAsync,
    isCreatingProject: createProjectMutation.isPending,
    addMember: addMemberMutation.mutateAsync,
    isAddingMember: addMemberMutation.isPending,
    acceptInvitation: acceptInvitationMutation.mutateAsync,
    isAcceptingInvitation: acceptInvitationMutation.isPending,
    declineInvitation: declineInvitationMutation.mutateAsync,
    isDecliningInvitation: declineInvitationMutation.isPending,
    members: membersQuery.data ?? [],
    isLoadingMembers: membersQuery.isLoading,
    deleteOrg: deleteOrgMutation.mutateAsync,
    isDeletingOrg: deleteOrgMutation.isPending,
    deleteMember: deleteMemberMutation.mutateAsync,
    isDeletingMember: deleteMemberMutation.isPending,
  };
}

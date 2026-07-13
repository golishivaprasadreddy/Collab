import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Database } from "@/integrations/supabase/types";

type CollaborationRequest = Database["public"]["Tables"]["collaboration_requests"]["Row"];
type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
type WorkspaceTask = Database["public"]["Tables"]["workspace_tasks"]["Row"];
type WorkspaceMilestone = Database["public"]["Tables"]["workspace_milestones"]["Row"];
type Rating = Database["public"]["Tables"]["ratings"]["Row"];

export interface CollaborationWithDetails extends CollaborationRequest {
  requester_profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    college: string | null;
  };
  requestee_profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    college: string | null;
  };
  workspace?: Workspace;
  tasks?: WorkspaceTask[];
  milestones?: WorkspaceMilestone[];
  ratings?: Rating[];
}

export function useCollaborationRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["collaboration-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return { incoming: [], sent: [] };

      const { data, error } = await supabase
        .from("collaboration_requests")
        .select("*")
        .or(`requester_id.eq.${user.id},requestee_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs for profile fetching
      const userIds = new Set<string>();
      data.forEach((r) => {
        userIds.add(r.requester_id);
        userIds.add(r.requestee_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, college")
        .in("id", Array.from(userIds));

      const enrichedData = data.map((request) => ({
        ...request,
        requester_profile: profiles?.find((p) => p.id === request.requester_id),
        requestee_profile: profiles?.find((p) => p.id === request.requestee_id),
      }));

      return {
        incoming: enrichedData.filter((r) => r.requestee_id === user.id),
        sent: enrichedData.filter((r) => r.requester_id === user.id),
      };
    },
    enabled: !!user?.id,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("collaboration-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "collaboration_requests",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["collaboration-requests"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}

export function useCreateCollaborationRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      requestee_id: string;
      skill_needed: string;
      purpose: string;
      description: string;
      duration?: string;
      collaboration_type: "learning" | "project" | "paid";
      agreed_amount?: number;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const insertData: Database["public"]["Tables"]["collaboration_requests"]["Insert"] = {
        requester_id: user.id,
        requestee_id: data.requestee_id,
        skill_needed: data.skill_needed,
        purpose: data.purpose,
        description: data.description,
        duration: data.duration || null,
        collaboration_type: data.collaboration_type,
      };
      
      if (data.collaboration_type === "paid" && data.agreed_amount) {
        insertData.agreed_amount = data.agreed_amount;
      }

      const { error } = await supabase.from("collaboration_requests").insert(insertData);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaboration-requests"] });
    },
  });
}

export function useUpdateCollaborationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CollaborationRequest>;
    }) => {
      const { error } = await supabase
        .from("collaboration_requests")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaboration-requests"] });
      queryClient.invalidateQueries({ queryKey: ["active-collaborations"] });
    },
  });
}

export function useActiveCollaborations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-collaborations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: requests, error } = await supabase
        .from("collaboration_requests")
        .select("*")
        .or(`requester_id.eq.${user.id},requestee_id.eq.${user.id}`)
        .in("status", ["ongoing", "accepted"])
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get profiles
      const userIds = new Set<string>();
      requests.forEach((r) => {
        userIds.add(r.requester_id);
        userIds.add(r.requestee_id);
      });

      const [profilesRes, workspacesRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, college").in("id", Array.from(userIds)),
        supabase.from("workspaces").select("*").in("collaboration_request_id", requests.map((r) => r.id)),
      ]);

      // Get tasks and milestones for workspaces
      const workspaceIds = workspacesRes.data?.map((w) => w.id) || [];
      const [tasksRes, milestonesRes] = await Promise.all([
        supabase.from("workspace_tasks").select("*").in("workspace_id", workspaceIds),
        supabase.from("workspace_milestones").select("*").in("workspace_id", workspaceIds),
      ]);

      return requests.map((request) => {
        const workspace = workspacesRes.data?.find((w) => w.collaboration_request_id === request.id);
        return {
          ...request,
          requester_profile: profilesRes.data?.find((p) => p.id === request.requester_id),
          requestee_profile: profilesRes.data?.find((p) => p.id === request.requestee_id),
          workspace,
          tasks: tasksRes.data?.filter((t) => t.workspace_id === workspace?.id) || [],
          milestones: milestonesRes.data?.filter((m) => m.workspace_id === workspace?.id) || [],
        };
      });
    },
    enabled: !!user?.id,
  });
}

export function useWorkspaceTasks(workspaceId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["workspace-tasks", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from("workspace_tasks")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  // Realtime subscription for tasks
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`workspace-tasks-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_tasks",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["workspace-tasks", workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return query;
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      workspace_id: string;
      title: string;
      description?: string;
      assigned_to?: string;
      due_date?: string;
    }) => {
      const { error } = await supabase.from("workspace_tasks").insert({
        workspace_id: data.workspace_id,
        title: data.title,
        description: data.description || null,
        assigned_to: data.assigned_to || null,
        due_date: data.due_date || null,
      });

      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-tasks", variables.workspace_id] });
      queryClient.invalidateQueries({ queryKey: ["active-collaborations"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      workspace_id,
      updates,
    }: {
      id: string;
      workspace_id: string;
      updates: Partial<WorkspaceTask>;
    }) => {
      const { error } = await supabase
        .from("workspace_tasks")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-tasks", variables.workspace_id] });
    },
  });
}

export function useCreateRating() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      collaboration_request_id: string;
      rated_user_id: string;
      score: number;
      feedback?: string;
      payment_confirmed?: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("ratings").insert({
        collaboration_request_id: data.collaboration_request_id,
        rated_by_user_id: user.id,
        rated_user_id: data.rated_user_id,
        score: data.score,
        feedback: data.feedback || null,
        payment_confirmed: data.payment_confirmed || false,
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-collaborations"] });
      queryClient.invalidateQueries({ queryKey: ["collaboration-requests"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

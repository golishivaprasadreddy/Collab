import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type Dispute = Database["public"]["Tables"]["disputes"]["Row"];

export function useDisputes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["disputes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .or(`reporter_id.eq.${user.id},reported_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Dispute[];
    },
    enabled: !!user?.id,
  });
}

export function useDisputeForCollaboration(collaborationId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dispute", collaborationId],
    queryFn: async () => {
      if (!collaborationId) return null;

      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .eq("collaboration_request_id", collaborationId)
        .in("status", ["open", "under_review"])
        .maybeSingle();

      if (error) throw error;
      return data as Dispute | null;
    },
    enabled: !!collaborationId && !!user?.id,
  });
}

export function useCreateDispute() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      collaboration_request_id: string;
      reported_id: string;
      reason: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: dispute, error } = await supabase
        .from("disputes")
        .insert({
          collaboration_request_id: data.collaboration_request_id,
          reporter_id: user.id,
          reported_id: data.reported_id,
          reason: data.reason,
        })
        .select()
        .single();

      if (error) throw error;
      return dispute;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["dispute", variables.collaboration_request_id] });
    },
  });
}

export function useHasOpenDispute() {
  const { data: disputes, isLoading } = useDisputes();

  const hasOpenDispute = disputes?.some(
    d => d.status === 'open' || d.status === 'under_review'
  ) || false;

  return { hasOpenDispute, isLoading };
}

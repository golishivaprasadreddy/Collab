import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ViolationType } from "@/utils/contentModeration";
import { Database } from "@/integrations/supabase/types";

type UserViolation = Database["public"]["Tables"]["user_violations"]["Row"];
type UserPenalty = Database["public"]["Tables"]["user_penalties"]["Row"];

export function useUserViolations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-violations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_violations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserViolation[];
    },
    enabled: !!user?.id,
  });
}

export function useActivePenalty() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-penalty", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_penalties")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // Check if penalty has expired
      if (data && data.ends_at && new Date(data.ends_at) < new Date()) {
        return null;
      }
      
      return data as UserPenalty | null;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Check every 30 seconds for penalty expiry
  });
}

export function useRecordViolation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      violation_type: ViolationType;
      blocked_content?: string;
      collaboration_request_id?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_violations").insert({
        user_id: user.id,
        violation_type: data.violation_type,
        blocked_content: data.blocked_content || null,
        collaboration_request_id: data.collaboration_request_id || null,
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-violations"] });
      queryClient.invalidateQueries({ queryKey: ["active-penalty"] });
    },
  });
}

export function useAcknowledgeViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (violationId: string) => {
      const { error } = await supabase
        .from("user_violations")
        .update({ acknowledged: true })
        .eq("id", violationId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-violations"] });
    },
  });
}

// Check if user can send messages (no active restricting penalty)
export function useCanSendMessages() {
  const { data: penalty, isLoading } = useActivePenalty();

  const canSend = !penalty || 
    penalty.penalty_type === 'warning' || 
    (penalty.ends_at && new Date(penalty.ends_at) < new Date());

  return {
    canSend,
    penalty,
    isLoading,
  };
}

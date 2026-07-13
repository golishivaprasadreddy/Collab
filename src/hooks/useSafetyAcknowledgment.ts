import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type SafetyAcknowledgment = Database["public"]["Tables"]["safety_acknowledgments"]["Row"];

const CURRENT_SAFETY_VERSION = 1;

export function useSafetyAcknowledgment() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["safety-acknowledgment", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("safety_acknowledgments")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as SafetyAcknowledgment | null;
    },
    enabled: !!user?.id,
  });
}

export function useHasAcknowledgedSafety() {
  const { data, isLoading } = useSafetyAcknowledgment();
  
  // Check if user has acknowledged current version
  const hasAcknowledged = data?.version === CURRENT_SAFETY_VERSION;
  
  return { hasAcknowledged, isLoading };
}

export function useAcknowledgeSafety() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      // Upsert to handle both new and existing acknowledgments
      const { error } = await supabase
        .from("safety_acknowledgments")
        .upsert({
          user_id: user.id,
          version: CURRENT_SAFETY_VERSION,
          acknowledged_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["safety-acknowledgment"] });
    },
  });
}

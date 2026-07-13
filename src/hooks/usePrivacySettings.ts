import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PrivacySettings {
  id: string;
  user_id: string;
  profile_visibility: string;
  show_email: boolean;
  show_college: boolean;
  show_earnings: boolean;
  allow_messages_from: string;
  created_at: string;
  updated_at: string;
}

export function usePrivacySettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["privacy-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("privacy_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as PrivacySettings | null;
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Omit<PrivacySettings, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check if settings exist
      const { data: existing } = await supabase
        .from("privacy_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("privacy_settings")
          .update(updates)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("privacy_settings")
          .insert({ user_id: user.id, ...updates })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["privacy-settings", user?.id] });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
  };
}

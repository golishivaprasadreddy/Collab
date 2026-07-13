import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  blocked_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useBlockedUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: blockedUsers = [], isLoading } = useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("blocked_users")
        .select(`
          id,
          blocker_id,
          blocked_id,
          blocked_at
        `)
        .eq("blocker_id", user.id)
        .order("blocked_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for blocked users
      const blockedIds = data.map(b => b.blocked_id);
      if (blockedIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", blockedIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(blocked => ({
        ...blocked,
        profile: profileMap.get(blocked.blocked_id) || { full_name: "Unknown User", avatar_url: null },
      })) as BlockedUser[];
    },
    enabled: !!user?.id,
  });

  const unblockUser = useMutation({
    mutationFn: async (blockedUserId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", blockedUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users", user?.id] });
    },
  });

  const blockUser = useMutation({
    mutationFn: async (userIdToBlock: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("blocked_users")
        .insert({ blocker_id: user.id, blocked_id: userIdToBlock });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users", user?.id] });
    },
  });

  return {
    blockedUsers,
    isLoading,
    unblockUser,
    blockUser,
  };
}

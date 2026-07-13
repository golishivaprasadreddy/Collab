import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  college: string | null;
  points: number;
  trust_score: number;
  total_collaborations: number;
  total_earnings: number;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data: reputations, error: repError } = await supabase
        .from("user_reputation")
        .select("user_id, points, trust_score, total_collaborations, total_earnings")
        .order("points", { ascending: false })
        .limit(100);

      if (repError) throw repError;
      if (!reputations?.length) return [];

      const userIds = reputations.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, college")
        .in("id", userIds);

      return reputations.map((rep) => {
        const profile = profiles?.find((p) => p.id === rep.user_id);
        return {
          user_id: rep.user_id,
          full_name: profile?.full_name || "Anonymous",
          avatar_url: profile?.avatar_url || null,
          college: profile?.college || null,
          points: rep.points || 0,
          trust_score: Number(rep.trust_score) || 0,
          total_collaborations: rep.total_collaborations || 0,
          total_earnings: rep.total_earnings || 0,
        };
      });
    },
  });
}

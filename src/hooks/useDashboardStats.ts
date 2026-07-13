import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardStats {
  totalCollaborations: number;
  completedCollaborations: number;
  ongoingCollaborations: number;
  totalEarnings: number;
  reputationScore: number;
  trustScore: number;
  points: number;
  totalProjects: number;
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboardStats", user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) throw new Error("Not authenticated");

      const [collabsRes, repRes, projectsRes] = await Promise.all([
        supabase
          .from("collaboration_requests")
          .select("*", { count: "exact" })
          .or(`requester_id.eq.${user.id},requestee_id.eq.${user.id}`),
        supabase
          .from("user_reputation")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("portfolio_projects")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      const collabs = collabsRes.data || [];
      const rep = repRes.data;

      const completed = collabs.filter((c) => c.status === "completed").length;
      const ongoing = collabs.filter((c) => c.status === "ongoing" || c.status === "accepted").length;

      return {
        totalCollaborations: collabs.length,
        completedCollaborations: completed,
        ongoingCollaborations: ongoing,
        totalEarnings: rep?.total_earnings || 0,
        reputationScore: rep?.points || 0,
        trustScore: Number(rep?.trust_score) || 0,
        points: rep?.points || 0,
        totalProjects: projectsRes.count || 0,
      };
    },
    enabled: !!user?.id,
  });
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  relatedId: string | null;
}

export function useActivityFeed(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activityFeed", user?.id, limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("activity_feed")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        type: item.activity_type,
        title: item.title,
        description: item.description,
        createdAt: item.created_at || new Date().toISOString(),
        relatedId: item.related_id,
      }));
    },
    enabled: !!user?.id,
  });
}

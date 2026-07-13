import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type SkillBadge = Database["public"]["Tables"]["skill_badges"]["Row"];

export interface SkillBadgeWithLevel extends SkillBadge {
  displayLevel: "bronze" | "silver" | "gold" | "platinum";
}

export function useSkillBadges(userId?: string) {
  return useQuery({
    queryKey: ["skillBadges", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("skill_badges")
        .select("*")
        .eq("user_id", userId)
        .order("collaborations_completed", { ascending: false });

      if (error) throw error;

      return (data || []).map((badge) => ({
        ...badge,
        displayLevel: badge.badge_level as "bronze" | "silver" | "gold" | "platinum",
      }));
    },
    enabled: !!userId,
  });
}

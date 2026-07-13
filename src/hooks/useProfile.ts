import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Skill = Database["public"]["Tables"]["skills"]["Row"];
type UserAvailability = Database["public"]["Tables"]["user_availability"]["Row"];
type UserReputation = Database["public"]["Tables"]["user_reputation"]["Row"];

export interface FullProfile extends Profile {
  skills: Skill[];
  availability: UserAvailability | null;
  reputation: UserReputation | null;
}

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["profile", targetUserId],
    queryFn: async (): Promise<FullProfile | null> => {
      if (!targetUserId) return null;

      const [profileRes, skillsRes, availRes, repRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", targetUserId).maybeSingle(),
        supabase.from("skills").select("*").eq("user_id", targetUserId),
        supabase.from("user_availability").select("*").eq("user_id", targetUserId).maybeSingle(),
        supabase.from("user_reputation").select("*").eq("user_id", targetUserId).maybeSingle(),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (!profileRes.data) return null;

      return {
        ...profileRes.data,
        skills: skillsRes.data || [],
        availability: availRes.data,
        reputation: repRes.data,
      };
    },
    enabled: !!targetUserId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      profile?: Partial<Profile>;
      skills?: Array<{ skill_name: string; level: "beginner" | "intermediate" | "advanced" }>;
      availability?: Partial<UserAvailability>;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const promises = [];

      if (data.profile) {
        promises.push(
          supabase
            .from("profiles")
            .upsert({ id: user.id, ...data.profile })
        );
      }

      if (data.skills) {
        // Delete existing skills and insert new ones
        await supabase.from("skills").delete().eq("user_id", user.id);
        if (data.skills.length > 0) {
          promises.push(
            supabase.from("skills").insert(
              data.skills.map((s) => ({
                user_id: user.id,
                skill_name: s.skill_name,
                level: s.level,
              }))
            )
          );
        }
      }

      if (data.availability) {
        promises.push(
          supabase
            .from("user_availability")
            .update(data.availability)
            .eq("user_id", user.id)
        );
      }

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Fetch skills and reputation for all profiles
      const profileIds = profiles.map((p) => p.id);
      
      const [skillsRes, repRes, availRes] = await Promise.all([
        supabase.from("skills").select("*").in("user_id", profileIds).limit(2000),
        supabase.from("user_reputation").select("*").in("user_id", profileIds).limit(500),
        supabase.from("user_availability").select("*").in("user_id", profileIds).limit(500),
      ]);

      return profiles.map((profile) => ({
        ...profile,
        skills: skillsRes.data?.filter((s) => s.user_id === profile.id) || [],
        reputation: repRes.data?.find((r) => r.user_id === profile.id) || null,
        availability: availRes.data?.find((a) => a.user_id === profile.id) || null,
      }));
    },
  });
}

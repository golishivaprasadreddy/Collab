import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type Dispute = Database["public"]["Tables"]["disputes"]["Row"];
type UserPenalty = Database["public"]["Tables"]["user_penalties"]["Row"];
type UserViolation = Database["public"]["Tables"]["user_violations"]["Row"];

interface ProfileBasic {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  college?: string | null;
}

export interface DisputeWithDetails extends Dispute {
  reporter_profile?: ProfileBasic;
  reported_profile?: ProfileBasic;
  collaboration?: {
    skill_needed: string;
    purpose: string;
  };
}

export interface ViolationWithDetails extends UserViolation {
  user_profile?: ProfileBasic;
}

export interface PenaltyWithDetails extends UserPenalty {
  user_profile?: ProfileBasic;
}

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase.rpc("is_admin");
      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
      return data === true;
    },
    enabled: !!user?.id,
  });
}

export function useAdminDisputes() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["admin-disputes"],
    queryFn: async () => {
      const { data: disputes, error } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = new Set<string>();
      const collaborationIds = new Set<string>();
      disputes.forEach((d) => {
        userIds.add(d.reporter_id);
        userIds.add(d.reported_id);
        collaborationIds.add(d.collaboration_request_id);
      });

      const [profilesRes, collaborationsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, college")
          .in("id", Array.from(userIds)),
        supabase
          .from("collaboration_requests")
          .select("id, skill_needed, purpose")
          .in("id", Array.from(collaborationIds)),
      ]);

      return disputes.map((dispute) => ({
        ...dispute,
        reporter_profile: profilesRes.data?.find((p) => p.id === dispute.reporter_id),
        reported_profile: profilesRes.data?.find((p) => p.id === dispute.reported_id),
        collaboration: collaborationsRes.data?.find(
          (c) => c.id === dispute.collaboration_request_id
        ),
      })) as DisputeWithDetails[];
    },
    enabled: isAdmin === true,
  });
}

export function useAdminViolations() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["admin-violations"],
    queryFn: async () => {
      const { data: violations, error } = await supabase
        .from("user_violations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = new Set<string>();
      violations.forEach((v) => userIds.add(v.user_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", Array.from(userIds));

      return violations.map((violation) => ({
        ...violation,
        user_profile: profiles?.find((p) => p.id === violation.user_id),
      })) as ViolationWithDetails[];
    },
    enabled: isAdmin === true,
  });
}

export function useAdminPenalties() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["admin-penalties"],
    queryFn: async () => {
      const { data: penalties, error } = await supabase
        .from("user_penalties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = new Set<string>();
      penalties.forEach((p) => userIds.add(p.user_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", Array.from(userIds));

      return penalties.map((penalty) => ({
        ...penalty,
        user_profile: profiles?.find((p) => p.id === penalty.user_id),
      })) as PenaltyWithDetails[];
    },
    enabled: isAdmin === true,
  });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      disputeId,
      status,
      resolutionNotes,
    }: {
      disputeId: string;
      status: Database["public"]["Enums"]["dispute_status"];
      resolutionNotes?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("disputes")
        .update({
          status,
          resolution_notes: resolutionNotes || null,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq("id", disputeId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
    },
  });
}

export function useCreatePenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      penalty_type: Database["public"]["Enums"]["penalty_type"];
      reason?: string;
      ends_at?: string;
    }) => {
      const { error } = await supabase.from("user_penalties").insert({
        user_id: data.user_id,
        penalty_type: data.penalty_type,
        reason: data.reason || null,
        starts_at: new Date().toISOString(),
        ends_at: data.ends_at || null,
        is_active: true,
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-penalties"] });
    },
  });
}

export function useUpdatePenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<UserPenalty>;
    }) => {
      const { error } = await supabase
        .from("user_penalties")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-penalties"] });
    },
  });
}

export function useAdminStats() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [disputesRes, penaltiesRes, violationsRes] = await Promise.all([
        supabase
          .from("disputes")
          .select("status", { count: "exact" })
          .in("status", ["open", "under_review"]),
        supabase
          .from("user_penalties")
          .select("id", { count: "exact" })
          .eq("is_active", true),
        supabase
          .from("user_violations")
          .select("id", { count: "exact" })
          .eq("acknowledged", false),
      ]);

      return {
        openDisputes: disputesRes.count || 0,
        activePenalties: penaltiesRes.count || 0,
        unacknowledgedViolations: violationsRes.count || 0,
      };
    },
    enabled: isAdmin === true,
  });
}

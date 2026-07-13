import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useMessages";

export interface ProjectGroup {
  signature: string;
  skill: string;
  purpose: string;
  description: string;
  members: Array<{
    id: string;
    name: string;
    avatar: string | null;
    collaborationId: string;
  }>;
  collaborationIds: string[];
  lastMessage: string;
  lastMessageTime: string;
  status: string;
}

function makeSignature(skill?: string | null, purpose?: string | null, description?: string | null) {
  return [skill, purpose, description]
    .map((v) => (v || "").trim().toLowerCase())
    .join("|");
}

/**
 * Splits the user's conversations into:
 *  - groups: collaborations that share the SAME (skill + purpose + description)
 *    → multiple people, one auto-grouped team chat
 *  - dms: standalone 1:1 collaborations (no other matching project)
 */
export function useProjectGroups() {
  const { data: conversations = [], isLoading } = useConversations();
  const { user } = useAuth();

  const result = useMemo(() => {
    const active = conversations.filter((c) => c.status !== "completed");
    const archived = conversations.filter((c) => c.status === "completed");

    // We need the underlying collab details (skill/purpose/description) to compute signatures.
    // useConversations already exposes `skill` (= skill_needed) but not purpose/description.
    // For now we group by (skill + participantId pattern not relevant). Refined below by fetching.
    return { active, archived };
  }, [conversations]);

  // Fetch the underlying collab details for grouping by purpose/description
  const { data: collabDetails = [] } = useQuery({
    queryKey: ["project-group-details", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("collaboration_requests")
        .select("id, skill_needed, purpose, description, status, requester_id, requestee_id")
        .or(`requester_id.eq.${user.id},requestee_id.eq.${user.id}`)
        .in("status", ["accepted", "ongoing", "completed"]);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const grouped = useMemo(() => {
    if (!user?.id) return { groups: [] as ProjectGroup[], dms: result.active, archived: result.archived };

    const sigBuckets = new Map<string, typeof collabDetails>();
    collabDetails.forEach((c) => {
      if (c.status === "completed") return; // archived handled separately
      const sig = makeSignature(c.skill_needed, c.purpose, c.description);
      const arr = sigBuckets.get(sig) || [];
      arr.push(c);
      sigBuckets.set(sig, arr);
    });

    const groupSignatures = new Set<string>();
    const groups: ProjectGroup[] = [];

    for (const [sig, items] of sigBuckets.entries()) {
      if (items.length < 2) continue; // not a group, just a 1:1 DM
      groupSignatures.add(sig);

      const members = items.map((c) => {
        const otherId = c.requester_id === user.id ? c.requestee_id : c.requester_id;
        const convo = result.active.find((a) => a.id === c.id);
        return {
          id: otherId,
          name: convo?.participantName || "Member",
          avatar: convo?.participantAvatar || null,
          collaborationId: c.id,
        };
      });

      // Latest convo in this group (for last message preview)
      const sortedConvos = items
        .map((c) => result.active.find((a) => a.id === c.id))
        .filter(Boolean) as typeof result.active;
      const latest = sortedConvos[0];

      groups.push({
        signature: sig,
        skill: items[0].skill_needed,
        purpose: items[0].purpose,
        description: items[0].description,
        members,
        collaborationIds: items.map((i) => i.id),
        lastMessage: latest?.lastMessage || "No messages yet",
        lastMessageTime: latest?.lastMessageTime || "",
        status: items[0].status,
      });
    }

    // DMs = active conversations whose collab is NOT part of any group
    const groupedCollabIds = new Set(groups.flatMap((g) => g.collaborationIds));
    const dms = result.active.filter((c) => !groupedCollabIds.has(c.id));

    return { groups, dms, archived: result.archived };
  }, [collabDetails, result, user?.id]);

  return { ...grouped, isLoading };
}

/**
 * Broadcast a message to every collaboration_request in a project group.
 * Sends one message per underlying 1:1 collab so RLS stays intact.
 */
export function useBroadcastToGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { collaborationIds: string[]; content: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (!data.content.trim()) throw new Error("Empty message");

      const rows = data.collaborationIds.map((id) => ({
        collaboration_request_id: id,
        sender_id: user.id,
        content: data.content,
      }));

      const { error } = await supabase.from("messages").insert(rows);
      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      variables.collaborationIds.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: ["messages", id] });
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

/**
 * Aggregate messages from multiple collaboration_requests into a single, time-sorted feed.
 */
export function useGroupMessages(collaborationIds: string[]) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["group-messages", collaborationIds.slice().sort().join(",")],
    queryFn: async () => {
      if (collaborationIds.length === 0) return [];
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .in("collaboration_request_id", collaborationIds)
        .order("sent_at", { ascending: true });
      if (error) throw error;

      const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", senderIds);

      return msgs.map((m) => ({
        ...m,
        sender_profile: profiles?.find((p) => p.id === m.sender_id),
      }));
    },
    enabled: collaborationIds.length > 0,
  });

  return query;
}

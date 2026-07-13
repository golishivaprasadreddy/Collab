import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];

export interface MessageWithSender extends Message {
  sender_profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useMessages(collaborationRequestId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", collaborationRequestId],
    queryFn: async () => {
      if (!collaborationRequestId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("collaboration_request_id", collaborationRequestId)
        .order("sent_at", { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(data.map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", senderIds);

      return data.map((message) => ({
        ...message,
        sender_profile: profiles?.find((p) => p.id === message.sender_id),
      }));
    },
    enabled: !!collaborationRequestId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!collaborationRequestId) return;

    const channel = supabase
      .channel(`messages-${collaborationRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `collaboration_request_id=eq.${collaborationRequestId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", collaborationRequestId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [collaborationRequestId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { collaboration_request_id: string; content: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("messages").insert({
        collaboration_request_id: data.collaboration_request_id,
        sender_id: user.id,
        content: data.content,
      });

      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.collaboration_request_id] });
    },
  });
}

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all accepted/ongoing collaborations
      const { data: collabs, error } = await supabase
        .from("collaboration_requests")
        .select("*")
        .or(`requester_id.eq.${user.id},requestee_id.eq.${user.id}`)
        .in("status", ["accepted", "ongoing", "completed"])
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get profiles for the other party
      const otherUserIds = collabs.map((c) =>
        c.requester_id === user.id ? c.requestee_id : c.requester_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", otherUserIds);

      // Get latest message for each collaboration
      const conversationsWithMessages = await Promise.all(
        collabs.map(async (collab) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("*")
            .eq("collaboration_request_id", collab.id)
            .order("sent_at", { ascending: false })
            .limit(1);

          const otherUserId = collab.requester_id === user.id ? collab.requestee_id : collab.requester_id;
          const otherProfile = profiles?.find((p) => p.id === otherUserId);

          // Count unread (messages not from current user that are recent)
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("collaboration_request_id", collab.id)
            .neq("sender_id", user.id);

          return {
            id: collab.id,
            participantId: otherUserId,
            participantName: otherProfile?.full_name || "Unknown",
            participantAvatar: otherProfile?.avatar_url,
            lastMessage: messages?.[0]?.content || "No messages yet",
            lastMessageTime: messages?.[0]?.sent_at
              ? formatRelativeTime(new Date(messages[0].sent_at))
              : "",
            status: collab.status,
            skill: collab.skill_needed,
            unread: 0, // Simplified for now
          };
        })
      );

      return conversationsWithMessages;
    },
    enabled: !!user?.id,
  });
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePinnedMessages(collaborationRequestId?: string) {
  return useQuery({
    queryKey: ["pinned-messages", collaborationRequestId],
    queryFn: async () => {
      if (!collaborationRequestId) return [];

      const { data, error } = await supabase
        .from("pinned_messages")
        .select("*")
        .eq("collaboration_request_id", collaborationRequestId)
        .order("pinned_at", { ascending: false });

      if (error) throw error;

      // Get the actual message content
      const messageIds = data.map((p) => p.message_id);
      if (messageIds.length === 0) return [];

      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .in("id", messageIds);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", [...new Set(messages?.map((m) => m.sender_id) || [])]);

      return data.map((pin) => {
        const message = messages?.find((m) => m.id === pin.message_id);
        const senderProfile = profiles?.find((p) => p.id === message?.sender_id);
        return {
          ...pin,
          message,
          sender_profile: senderProfile,
        };
      });
    },
    enabled: !!collaborationRequestId,
  });
}

export function usePinMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { collaboration_request_id: string; message_id: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("pinned_messages").insert({
        collaboration_request_id: data.collaboration_request_id,
        message_id: data.message_id,
        pinned_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["pinned-messages", variables.collaboration_request_id],
      });
    },
  });
}

export function useUnpinMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { collaboration_request_id: string; message_id: string }) => {
      const { error } = await supabase
        .from("pinned_messages")
        .delete()
        .eq("collaboration_request_id", data.collaboration_request_id)
        .eq("message_id", data.message_id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["pinned-messages", variables.collaboration_request_id],
      });
    },
  });
}

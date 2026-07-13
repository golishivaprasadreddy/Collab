import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useReadReceipts(collaborationRequestId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (!user?.id || messageIds.length === 0) return;

      const now = new Date().toISOString();

      // Update messages that weren't sent by the current user
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: now })
        .in("id", messageIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", collaborationRequestId] });
    },
  });

  // Mark messages as read when viewing the conversation
  const markMessagesAsRead = (messageIds: string[]) => {
    markAsReadMutation.mutate(messageIds);
  };

  return {
    markMessagesAsRead,
    isMarking: markAsReadMutation.isPending,
  };
}

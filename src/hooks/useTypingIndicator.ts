import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTypingIndicator(collaborationRequestId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // Subscribe to typing indicator changes
  useEffect(() => {
    if (!collaborationRequestId || !user?.id) return;

    const channel = supabase
      .channel(`typing-${collaborationRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `collaboration_request_id=eq.${collaborationRequestId}`,
        },
        (payload) => {
          const newData = payload.new as { user_id: string; is_typing: boolean } | undefined;
          if (newData && newData.user_id !== user.id) {
            setIsPartnerTyping(newData.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [collaborationRequestId, user?.id]);

  // Fetch initial typing state
  useQuery({
    queryKey: ["typingIndicator", collaborationRequestId],
    queryFn: async () => {
      if (!collaborationRequestId || !user?.id) return null;

      const { data } = await supabase
        .from("typing_indicators")
        .select("*")
        .eq("collaboration_request_id", collaborationRequestId)
        .neq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setIsPartnerTyping(data.is_typing || false);
      }

      return data;
    },
    enabled: !!collaborationRequestId && !!user?.id,
  });

  const updateTypingMutation = useMutation({
    mutationFn: async (isTyping: boolean) => {
      if (!collaborationRequestId || !user?.id) return;

      const { error } = await supabase
        .from("typing_indicators")
        .upsert(
          {
            collaboration_request_id: collaborationRequestId,
            user_id: user.id,
            is_typing: isTyping,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "collaboration_request_id,user_id" }
        );

      if (error) throw error;
    },
  });

  const startTyping = () => {
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to true
    updateTypingMutation.mutate(true);

    // Set timeout to stop typing after 3 seconds of no activity
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingMutation.mutate(false);
    }, 3000);
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    updateTypingMutation.mutate(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isPartnerTyping,
    startTyping,
    stopTyping,
  };
}

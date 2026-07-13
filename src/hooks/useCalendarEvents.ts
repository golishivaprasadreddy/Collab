import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];

export interface CalendarEventInput {
  collaboration_request_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}

export function useCalendarEvents(collaborationRequestId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["calendarEvents", collaborationRequestId],
    queryFn: async () => {
      if (!collaborationRequestId) return [];

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("collaboration_request_id", collaborationRequestId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!collaborationRequestId,
  });

  return query;
}

export function useCreateCalendarEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CalendarEventInput) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          ...input,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["calendarEvents", variables.collaboration_request_id] 
      });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<CalendarEventInput> 
    }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["calendarEvents", data.collaboration_request_id] 
      });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, collaborationRequestId }: { id: string; collaborationRequestId: string }) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, collaborationRequestId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["calendarEvents", data.collaborationRequestId] 
      });
    },
  });
}

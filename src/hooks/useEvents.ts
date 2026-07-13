import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EventScope = "college" | "national" | "global";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  category: "technical" | "non_technical";
  event_type: string;
  event_subtype: string | null;
  event_date: string;
  mode: "online" | "offline" | "hybrid";
  registration_deadline: string | null;
  registration_link: string | null;
  image_url: string | null;
  venue: string | null;
  location: string | null;
  scope: EventScope;
  college: string | null;
  organizer_id: string | null;
  min_team_size: number;
  max_team_size: number;
  created_by: string;
  created_at: string;
}

interface EventsFilter {
  category?: "technical" | "non_technical";
  scope?: EventScope | "national_global";
  college?: string | null;
}

export function useEvents(filter?: EventsFilter) {
  return useQuery({
    queryKey: ["events", filter],
    queryFn: async (): Promise<Event[]> => {
      let query = supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true })
        .limit(500);

      if (filter?.category) query = query.eq("category", filter.category);

      if (filter?.scope === "college" && filter.college) {
        query = query.eq("scope", "college").eq("college", filter.college);
      } else if (filter?.scope === "national_global") {
        query = query.in("scope", ["national", "global"]);
      } else if (filter?.scope) {
        query = query.eq("scope", filter.scope);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Event[];
    },
  });
}

export function useEventRegistrations(eventId?: string) {
  return useQuery({
    queryKey: ["event-registrations", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Calendar, Globe, MapPin, Monitor, Loader2, Settings2, GraduationCap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Scope = "college" | "national" | "global";

interface EventForm {
  title: string;
  description: string;
  category: "technical" | "non_technical";
  event_type: string;
  event_subtype: string;
  scope: Scope;
  college: string;
  event_date: string;
  mode: "online" | "offline" | "hybrid";
  registration_deadline: string;
  registration_link: string;
  image_url: string;
  venue: string;
  location: string;
  min_team_size: number;
  max_team_size: number;
}

const emptyForm: EventForm = {
  title: "",
  description: "",
  category: "technical",
  event_type: "hackathon",
  event_subtype: "hackathon",
  scope: "national",
  college: "",
  event_date: "",
  mode: "online",
  registration_deadline: "",
  registration_link: "",
  image_url: "",
  venue: "",
  location: "",
  min_team_size: 1,
  max_team_size: 1,
};

const SUBTYPES = [
  "fest", "club", "workshop", "hackathon", "cultural", "startup", "department",
  "coding_competition", "summit", "business_competition",
];

const modeIcons = { online: Monitor, offline: MapPin, hybrid: Globe };

export function EventsPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(emptyForm);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (form.scope === "college" && !form.college.trim()) {
        throw new Error("College name is required for college events");
      }
      if (form.max_team_size < form.min_team_size) {
        throw new Error("Max team size must be ≥ min team size");
      }
      const { error } = await supabase.from("events").insert({
        title: form.title,
        description: form.description || null,
        category: form.category,
        event_type: form.event_type,
        event_subtype: form.event_subtype || null,
        scope: form.scope,
        college: form.scope === "college" ? form.college.trim() : null,
        event_date: form.event_date,
        mode: form.mode,
        registration_deadline: form.registration_deadline || null,
        registration_link: form.registration_link || null,
        image_url: form.image_url || null,
        venue: form.venue || null,
        location: form.location || null,
        min_team_size: form.min_team_size,
        max_team_size: form.max_team_size,
        organizer_id: user.id,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setForm(emptyForm);
      setOpen(false);
      toast({ title: "Event created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create event", description: err.message, variant: "destructive" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event deleted" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Manage Events</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event description" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Scope *</Label>
                  <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v as Scope })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="college">College</SelectItem>
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>College {form.scope === "college" && "*"}</Label>
                  <Input
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    placeholder="e.g. IIT Bombay"
                    disabled={form.scope !== "college"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as "technical" | "non_technical" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="non_technical">Non-Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Event Type *</Label>
                  <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="coding_competition">Coding Competition</SelectItem>
                      <SelectItem value="tech_challenge">Tech Challenge</SelectItem>
                      <SelectItem value="startup">Startup Event</SelectItem>
                      <SelectItem value="summit">Summit</SelectItem>
                      <SelectItem value="business_competition">Business Competition</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Subtype (filter chip)</Label>
                <Select value={form.event_subtype} onValueChange={(v) => setForm({ ...form, event_subtype: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBTYPES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Event Date *</Label>
                  <Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                </div>
                <div>
                  <Label>Mode *</Label>
                  <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v as "online" | "offline" | "hybrid" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min team size</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.min_team_size}
                    onChange={(e) => setForm({ ...form, min_team_size: Math.max(1, parseInt(e.target.value || "1")) })}
                  />
                </div>
                <div>
                  <Label>Max team size</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.max_team_size}
                    onChange={(e) => setForm({ ...form, max_team_size: Math.max(1, parseInt(e.target.value || "1")) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Venue</Label>
                  <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Auditorium A" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Mumbai" />
                </div>
              </div>

              <div>
                <Label>Registration Deadline</Label>
                <Input type="datetime-local" value={form.registration_deadline} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} />
              </div>
              <div>
                <Label>Registration Link</Label>
                <Input value={form.registration_link} onChange={(e) => setForm({ ...form, registration_link: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <Button
                className="w-full"
                onClick={() => createEvent.mutate()}
                disabled={!form.title || !form.event_date || createEvent.isPending}
              >
                {createEvent.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No events yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const ModeIcon = modeIcons[event.mode as keyof typeof modeIcons] || Globe;
            return (
              <Card key={event.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] capitalize">{event.scope}</Badge>
                        {event.college && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {event.college}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          {event.event_type.replace(/_/g, " ")}
                        </Badge>
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <ModeIcon className="h-3 w-3" />
                          {event.mode}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/events/${event.id}/manage`)}
                        title="Manage event"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteEvent.mutate(event.id)}
                        disabled={deleteEvent.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

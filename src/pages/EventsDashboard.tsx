import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEvents, type EventScope } from "@/hooks/useEvents";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveCollaborations } from "@/hooks/useCollaborations";
import {
  Users,
  Code2,
  Mic2,
  Loader2,
  Trophy,
  Rocket,
  CheckCircle2,
  Copy,
  Map,
  List,
  GraduationCap,
  Globe2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { EventCard } from "@/components/events/EventCard";
import { EventFilterBar, defaultFilters, type EventFilterState } from "@/components/events/EventFilters";
import { EventMapView } from "@/components/events/EventMapView";
import { Link } from "react-router-dom";

const SUBTYPES = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "fest", label: "Fests", emoji: "🎉" },
  { id: "club", label: "Club Events", emoji: "👥" },
  { id: "workshop", label: "Workshops", emoji: "🛠️" },
  { id: "hackathon", label: "Hackathons", emoji: "🏆" },
  { id: "cultural", label: "Cultural", emoji: "🎭" },
  { id: "startup", label: "Startup", emoji: "🚀" },
  { id: "department", label: "Dept. Activity", emoji: "🏛️" },
];

function TeamPanel() {
  const { data: profile } = useProfile();
  const { data: collabs = [] } = useActiveCollaborations();
  const { toast } = useToast();

  const activeCollabs = collabs.filter(
    (c: { status?: string }) => c.status === "ongoing" || c.status === "accepted"
  );

  const copyTeamDetails = () => {
    const details = activeCollabs
      .map((c: { skill_needed?: string | null; purpose?: string | null }) => `• ${c.skill_needed} collaboration - ${c.purpose}`)
      .join("\n");
    navigator.clipboard.writeText(
      `Team Details:\nMember: ${profile?.full_name || "Me"}\n${details}`
    );
    toast({ title: "Copied!", description: "Team details copied to clipboard" });
  };

  if (activeCollabs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-card rounded-2xl border border-border p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <h3 className="font-semibold text-foreground">Your Team is Ready ✅</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={copyTeamDetails}>
          <Copy className="h-4 w-4 mr-1" />
          Copy
        </Button>
      </div>
      <div className="space-y-2">
        {activeCollabs.slice(0, 3).map((collab: { id: string; skill_needed?: string | null; purpose?: string | null; status?: string }, i: number) => (
          <motion.div
            key={collab.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
              {collab.skill_needed?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{collab.purpose}</p>
              <p className="text-xs text-muted-foreground">Role: {collab.skill_needed}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {collab.status}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function NoCollegeCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-2xl border border-dashed border-border p-8 text-center"
    >
      <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
      <h3 className="font-semibold text-foreground mb-1">Set your college first</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add your college in your profile to see fests, workshops, and club events from your campus.
      </p>
      <Link to="/profile-setup">
        <Button>Update Profile</Button>
      </Link>
    </motion.div>
  );
}

export default function EventsDashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const userCollege = profile?.college || null;

  const [section, setSection] = useState<"college" | "global">(userCollege ? "college" : "global");
  const [category, setCategory] = useState<string>("all");
  const [subtype, setSubtype] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filters, setFilters] = useState<EventFilterState>(defaultFilters);

  const eventsFilter = useMemo(() => {
    const base: Record<string, string | null | undefined> = {};
    if (category !== "all") base.category = category;
    if (section === "college") {
      base.scope = "college" as EventScope;
      base.college = userCollege;
    } else {
      base.scope = "national_global";
    }
    return base;
  }, [section, category, userCollege]);

  const { data: events = [], isLoading } = useEvents(eventsFilter);

  const venues = useMemo(
    () => [...new Set(events.map((e) => e.venue).filter(Boolean) as string[])],
    [events]
  );
  const locations = useMemo(
    () => [...new Set(events.map((e) => e.location).filter(Boolean) as string[])],
    [events]
  );

  const now = new Date();

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (subtype !== "all" && e.event_subtype !== subtype) return false;
      if (filters.venue && e.venue !== filters.venue) return false;
      if (filters.location && e.location !== filters.location) return false;
      if (filters.mode !== "all" && e.mode !== filters.mode) return false;
      if (filters.dateRange !== "all") {
        const d = new Date(e.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (filters.dateRange === "this_week") {
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          if (d < today || d > weekEnd) return false;
        } else if (filters.dateRange === "this_month") {
          if (d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear()) return false;
        } else if (filters.dateRange === "next_month") {
          const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          const nextEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
          if (d < next || d > nextEnd) return false;
        }
      }
      return true;
    });
  }, [events, filters, subtype]);

  const upcomingEvents = filteredEvents.filter((e) => new Date(e.event_date) >= now);
  const pastEvents = filteredEvents.filter((e) => new Date(e.event_date) < now);
  const showCollegeCTA = section === "college" && !userCollege;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="gradient-hero px-6 pt-12 pb-8 rounded-b-3xl"
      >
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <h1 className="text-2xl font-bold text-primary-foreground">Events Dashboard</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">
            Campus fests, hackathons, summits & global competitions
          </p>
        </motion.div>
      </motion.div>

      <div className="px-4 pt-5 space-y-5">
        {/* Two main sections */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setSection("college")}
            className={`relative rounded-2xl p-4 text-left transition-all border ${
              section === "college"
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-foreground border-border hover:border-primary/40"
            }`}
          >
            <GraduationCap className="h-5 w-5 mb-1.5" />
            <div className="font-semibold text-sm">My College</div>
            <div className={`text-[11px] ${section === "college" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              {userCollege || "Set college in profile"}
            </div>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setSection("global")}
            className={`relative rounded-2xl p-4 text-left transition-all border ${
              section === "global"
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-foreground border-border hover:border-primary/40"
            }`}
          >
            <Globe2 className="h-5 w-5 mb-1.5" />
            <div className="font-semibold text-sm">National & Global</div>
            <div className={`text-[11px] ${section === "global" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              Hackathons, summits & more
            </div>
          </motion.button>
        </div>

        <TeamPanel />

        {/* Subtype chip row */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SUBTYPES.map((s) => (
            <motion.button
              key={s.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSubtype(s.id)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                subtype === s.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              <span className="mr-1">{s.emoji}</span>
              {s.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Category + view + filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Tabs value={category} onValueChange={setCategory} className="flex-1">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="technical" className="text-xs">
                <Code2 className="h-3.5 w-3.5 mr-1" />
                Technical
              </TabsTrigger>
              <TabsTrigger value="non_technical" className="text-xs">
                <Mic2 className="h-3.5 w-3.5 mr-1" />
                Non-Tech
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
              className={`h-9 w-9 rounded-full border flex items-center justify-center transition-all ${
                viewMode === "map" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {viewMode === "list" ? <Map className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </motion.button>
            <EventFilterBar
              filters={filters}
              onFiltersChange={setFilters}
              venues={venues}
              locations={locations}
            />
          </div>
        </motion.div>

        {/* Map View */}
        <AnimatePresence>
          {viewMode === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <EventMapView events={filteredEvents} />
            </motion.div>
          )}
        </AnimatePresence>

        {showCollegeCTA && <NoCollegeCTA />}

        {/* Events List */}
        {!showCollegeCTA && (
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </motion.div>
            ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="text-center py-12"
              >
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">No Events Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {section === "college"
                    ? `No events for ${userCollege} yet — check back soon!`
                    : "Try adjusting your filters"}
                </p>
              </motion.div>
            ) : (
              <motion.div key="events" className="space-y-5">
                {upcomingEvents.length > 0 && (
                  <div>
                    <motion.h2
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-semibold text-foreground mb-3 flex items-center gap-2"
                    >
                      <Rocket className="h-4 w-4 text-primary" />
                      Upcoming Events ({upcomingEvents.length})
                    </motion.h2>
                    <div className="space-y-3">
                      {upcomingEvents.map((event, i) => (
                        <EventCard key={event.id} event={event} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {pastEvents.length > 0 && (
                  <div>
                    <motion.h2
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-semibold text-muted-foreground mb-3 flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Past Events ({pastEvents.length})
                    </motion.h2>
                    <div className="space-y-3 opacity-70">
                      {pastEvents.map((event, i) => (
                        <EventCard key={event.id} event={event} index={i} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

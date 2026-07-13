import { motion } from "framer-motion";
import { MapPin, Building2, Globe } from "lucide-react";
import { Event } from "@/hooks/useEvents";
import { Badge } from "@/components/ui/badge";

interface EventMapViewProps {
  events: Event[];
}

const locationCoords: Record<string, { lat: number; lng: number }> = {
  "Bangalore, India": { lat: 12.97, lng: 77.59 },
  "Hyderabad, India": { lat: 17.38, lng: 78.49 },
  "Delhi, India": { lat: 28.61, lng: 77.21 },
  "Mumbai, India": { lat: 19.08, lng: 72.88 },
  "Pune, India": { lat: 18.52, lng: 73.86 },
  "Chennai, India": { lat: 13.08, lng: 80.27 },
  "Virtual": { lat: 20.59, lng: 78.96 },
};

const modeColors: Record<string, string> = {
  online: "bg-blue-500",
  offline: "bg-orange-500",
  hybrid: "bg-purple-500",
};

export function EventMapView({ events }: EventMapViewProps) {
  // Group events by location
  const grouped = events.reduce((acc, event) => {
    const loc = event.location || "Unknown";
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const locations = Object.entries(grouped);

  if (locations.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No event locations to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Visual map representation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 rounded-2xl border border-border p-4 overflow-hidden min-h-[200px]"
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Event Locations</span>
            <Badge variant="secondary" className="text-[10px] ml-auto">
              {locations.length} locations
            </Badge>
          </div>

          {/* Location pins */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {locations.map(([location, evts], i) => (
              <motion.div
                key={location}
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 22 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-card/90 backdrop-blur-sm rounded-xl p-3 border border-border/80 shadow-sm cursor-default"
              >
                <div className="flex items-start gap-2">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.3, ease: "easeInOut" }}
                  >
                    <MapPin className={`h-5 w-5 ${location === "Virtual" ? "text-blue-500" : "text-destructive"}`} />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{location}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {evts.length} event{evts.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {evts.slice(0, 2).map((evt) => (
                    <div key={evt.id} className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${modeColors[evt.mode] || "bg-muted-foreground"}`} />
                      <span className="text-[10px] text-muted-foreground truncate">{evt.title}</span>
                    </div>
                  ))}
                  {evts.length > 2 && (
                    <span className="text-[10px] text-primary font-medium">+{evts.length - 2} more</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-[10px] text-muted-foreground">Online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-[10px] text-muted-foreground">Offline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="text-[10px] text-muted-foreground">Hybrid</span>
        </div>
      </div>
    </div>
  );
}

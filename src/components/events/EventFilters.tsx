/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, MapPin, Calendar, Building2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface EventFilterState {
  venue: string;
  location: string;
  dateRange: "all" | "this_week" | "this_month" | "next_month";
  mode: "all" | "online" | "offline" | "hybrid";
}

const defaultFilters: EventFilterState = {
  venue: "",
  location: "",
  dateRange: "all",
  mode: "all",
};

const dateOptions = [
  { value: "all", label: "All Dates" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "next_month", label: "Next Month" },
];

const modeOptions = [
  { value: "all", label: "All Modes" },
  { value: "online", label: "🌐 Online" },
  { value: "offline", label: "📍 Offline" },
  { value: "hybrid", label: "🔀 Hybrid" },
];

interface EventFiltersProps {
  filters: EventFilterState;
  onFiltersChange: (filters: EventFilterState) => void;
  venues: string[];
  locations: string[];
}

export function EventFilterBar({
  filters,
  onFiltersChange,
  venues,
  locations,
}: EventFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [local, setLocal] = useState(filters);

  const activeCount = [
    filters.venue,
    filters.location,
    filters.dateRange !== "all" ? filters.dateRange : "",
    filters.mode !== "all" ? filters.mode : "",
  ].filter(Boolean).length;

  const handleOpen = () => {
    setLocal(filters);
    setIsOpen(true);
  };

  const handleApply = () => {
    onFiltersChange(local);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocal(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="gap-2 rounded-full border-border hover:border-primary/50 transition-all"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-primary text-primary-foreground text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold"
            >
              {activeCount}
            </motion.span>
          )}
        </Button>
      </motion.div>

      {/* Active filter chips */}
      <AnimatePresence>
        {activeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 overflow-hidden"
          >
            {filters.venue && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                <Badge variant="secondary" className="gap-1 pr-1">
                  <Building2 className="h-3 w-3" /> {filters.venue}
                  <button onClick={() => onFiltersChange({ ...filters, venue: "" })} className="ml-1 rounded-full hover:bg-foreground/10 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            )}
            {filters.location && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                <Badge variant="secondary" className="gap-1 pr-1">
                  <MapPin className="h-3 w-3" /> {filters.location}
                  <button onClick={() => onFiltersChange({ ...filters, location: "" })} className="ml-1 rounded-full hover:bg-foreground/10 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            )}
            {filters.dateRange !== "all" && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                <Badge variant="secondary" className="gap-1 pr-1">
                  <Calendar className="h-3 w-3" /> {dateOptions.find(d => d.value === filters.dateRange)?.label}
                  <button onClick={() => onFiltersChange({ ...filters, dateRange: "all" })} className="ml-1 rounded-full hover:bg-foreground/10 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            )}
            {filters.mode !== "all" && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                <Badge variant="secondary" className="gap-1 pr-1">
                  {filters.mode}
                  <button onClick={() => onFiltersChange({ ...filters, mode: "all" })} className="ml-1 rounded-full hover:bg-foreground/10 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle>Event Filters</SheetTitle>
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  Clear all
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="space-y-6 pb-24">
            {/* Date Range */}
            <div>
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Date Range
              </h3>
              <div className="flex flex-wrap gap-2">
                {dateOptions.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLocal({ ...local, dateRange: opt.value as EventFilterState["dateRange"] })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      local.dateRange === opt.value
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background border-border text-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt.label}
                    {local.dateRange === opt.value && <Check className="inline ml-1 h-3 w-3" />}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Event Mode
              </h3>
              <div className="flex flex-wrap gap-2">
                {modeOptions.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLocal({ ...local, mode: opt.value as EventFilterState["mode"] })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      local.mode === opt.value
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background border-border text-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt.label}
                    {local.mode === opt.value && <Check className="inline ml-1 h-3 w-3" />}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Venue */}
            <div>
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Venue
              </h3>
              {venues.length > 0 ? (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {venues.map((v) => (
                    <motion.button
                      key={v}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setLocal({ ...local, venue: local.venue === v ? "" : v })}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                        local.venue === v
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      {v}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No venues available</p>
              )}
            </div>

            {/* Location */}
            <div>
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Location
              </h3>
              {locations.length > 0 ? (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {locations.map((l) => (
                    <motion.button
                      key={l}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setLocal({ ...local, location: local.location === l ? "" : l })}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                        local.location === l
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      {l}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No locations available</p>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <Button onClick={handleApply} className="w-full h-12 gradient-primary border-0">
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { defaultFilters };

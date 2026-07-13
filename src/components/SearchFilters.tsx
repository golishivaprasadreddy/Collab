import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillBadge } from "@/components/ui/skill-badge";
import { Check, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const skillLevels = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const availabilityOptions = ["All", "Learning", "Project", "Paid"];

interface SearchFiltersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    level: string;
    availability: string;
    college: string;
  };
  onFiltersChange: (filters: { level: string; availability: string; college: string }) => void;
  colleges: string[];
}

export function SearchFilters({
  isOpen,
  onOpenChange,
  filters,
  onFiltersChange,
  colleges,
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [collegeSearch, setCollegeSearch] = useState("");

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const filteredColleges = colleges.filter((c) =>
    c.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    const cleared = { level: "All Levels", availability: "All", college: "" };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const hasActiveFilters =
    localFilters.level !== "All Levels" ||
    localFilters.availability !== "All" ||
    localFilters.college !== "";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-24">
          {/* Skill Level */}
          <div>
            <h3 className="font-medium text-foreground mb-3">Skill Level</h3>
            <div className="flex flex-wrap gap-2">
              {skillLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setLocalFilters({ ...localFilters, level })}
                >
                  <SkillBadge
                    variant={localFilters.level === level ? "default" : "outline"}
                    selected={localFilters.level === level}
                    className="cursor-pointer"
                  >
                    {level}
                    {localFilters.level === level && <Check className="ml-1 h-3 w-3" />}
                  </SkillBadge>
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="font-medium text-foreground mb-3">Availability</h3>
            <div className="flex flex-wrap gap-2">
              {availabilityOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setLocalFilters({ ...localFilters, availability: option })}
                >
                  <SkillBadge
                    variant={localFilters.availability === option ? "default" : "outline"}
                    selected={localFilters.availability === option}
                    className="cursor-pointer"
                  >
                    {option === "Paid" ? "💰 Paid" : option}
                    {localFilters.availability === option && <Check className="ml-1 h-3 w-3" />}
                  </SkillBadge>
                </button>
              ))}
            </div>
          </div>

          {/* College */}
          <div>
            <h3 className="font-medium text-foreground mb-3">College</h3>
            <Input
              placeholder="Search colleges..."
              value={collegeSearch}
              onChange={(e) => setCollegeSearch(e.target.value)}
              className="mb-3 h-11"
            />
            
            <AnimatePresence>
              {localFilters.college && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-3"
                >
                  <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-lg">
                    <span className="text-sm font-medium truncate flex-1">
                      {localFilters.college}
                    </span>
                    <button
                      onClick={() => setLocalFilters({ ...localFilters, college: "" })}
                      className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredColleges.slice(0, 10).map((college) => (
                <button
                  key={college}
                  onClick={() => {
                    setLocalFilters({ ...localFilters, college });
                    setCollegeSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    localFilters.college === college
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  {college}
                </button>
              ))}
              {filteredColleges.length === 0 && collegeSearch && (
                <p className="text-sm text-muted-foreground px-3 py-2">
                  No colleges found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Apply Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button onClick={handleApply} className="w-full h-12 gradient-primary border-0">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

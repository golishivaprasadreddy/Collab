import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/ui/profile-card";
import { SkillBadge } from "@/components/ui/skill-badge";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import { SearchFilters } from "@/components/SearchFilters";
import { useProfiles } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { fuzzyMatch, fuzzyScore } from "@/utils/fuzzySearch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const popularSkills = [
  "React",
  "Python",
  "UI/UX Design",
  "Machine Learning",
  "Flutter",
  "Node.js",
];

export default function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSkill = searchParams.get("skill") || "";

  const { data: profiles, isLoading } = useProfiles();

  const [query, setQuery] = useState(initialSkill);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "trust_score">("relevance");
  const [filters, setFilters] = useState({
    level: "All Levels",
    availability: "All",
    college: "",
  });

  const colleges = useMemo(() => {
    const collegeSet = new Set<string>();
    (profiles || []).forEach((p) => {
      if (p.college) collegeSet.add(p.college);
    });
    return Array.from(collegeSet).sort();
  }, [profiles]);

  const allProfiles = useMemo(() => {
    return (profiles || [])
      .filter((p) => p.id !== user?.id)
      .map((profile) => ({
        id: profile.id,
        name: profile.full_name || "Anonymous",
        college: profile.college || "Unknown",
        skills: profile.skills.map((s) => ({
          name: s.skill_name,
          level: (s.level.charAt(0).toUpperCase() + s.level.slice(1)) as "Beginner" | "Intermediate" | "Advanced",
        })),
        points: profile.reputation?.points || 0,
        trustScore: profile.reputation?.trust_score ? Number(profile.reputation.trust_score) : 0,
        completedCollabs: profile.reputation?.total_collaborations || 0,
        isPaidAvailable: profile.is_paid_available || false,
        availability: [
          profile.availability?.learning ? "learning" : null,
          profile.availability?.project ? "project" : null,
          profile.availability?.paid_collaboration ? "paid" : null,
        ].filter(Boolean) as string[],
      }));
  }, [profiles, user?.id]);

  const filteredProfiles = useMemo(() => {
    const filtered = allProfiles.filter((profile) => {
      const matchesQuery =
        !query ||
        profile.skills.some((skill) => fuzzyMatch(query, skill.name)) ||
        fuzzyMatch(query, profile.name);

      const matchesLevel =
        filters.level === "All Levels" ||
        profile.skills.some((skill) => skill.level === filters.level);

      const matchesAvailability =
        filters.availability === "All" ||
        profile.availability.includes(filters.availability.toLowerCase());

      const matchesCollege =
        !filters.college ||
        profile.college.toLowerCase() === filters.college.toLowerCase();

      return matchesQuery && matchesLevel && matchesAvailability && matchesCollege;
    });

    if (sortBy === "trust_score") {
      filtered.sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));
    } else {
      if (query) {
        filtered.sort((a, b) => {
          const aScore = Math.min(...a.skills.map((s) => fuzzyScore(query, s.name)));
          const bScore = Math.min(...b.skills.map((s) => fuzzyScore(query, s.name)));
          if (aScore !== bScore) return aScore - bScore;
          return b.points - a.points;
        });
      } else {
        filtered.sort((a, b) => b.points - a.points);
      }
    }

    return filtered;
  }, [allProfiles, query, filters, sortBy]);

  const handleViewPortfolio = (id: string) => {
    navigate(`/profile/${id}`);
  };

  const hasActiveFilters =
    filters.level !== "All Levels" || filters.availability !== "All" || filters.college !== "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Search header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4"
      >
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills or people..."
              className="pl-11 h-12 pr-10"
              autoFocus
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="outline"
              size="icon"
              className={`h-12 w-12 flex-shrink-0 transition-all ${
                hasActiveFilters ? "border-primary text-primary shadow-md" : ""
              }`}
              onClick={() => setIsFilterOpen(true)}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* Active filter badges */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 overflow-x-auto mt-3 pb-1 -mx-4 px-4"
            >
              {filters.level !== "All Levels" && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <SkillBadge variant="default" className="flex-shrink-0">
                    {filters.level}
                    <button onClick={() => setFilters({ ...filters, level: "All Levels" })} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </SkillBadge>
                </motion.div>
              )}
              {filters.availability !== "All" && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.05 }}>
                  <SkillBadge variant="default" className="flex-shrink-0">
                    {filters.availability}
                    <button onClick={() => setFilters({ ...filters, availability: "All" })} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </SkillBadge>
                </motion.div>
              )}
              {filters.college && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <SkillBadge variant="default" className="flex-shrink-0 max-w-[200px]">
                    <span className="truncate">{filters.college}</span>
                    <button onClick={() => setFilters({ ...filters, college: "" })} className="ml-1 flex-shrink-0">
                      <X className="h-3 w-3" />
                    </button>
                  </SkillBadge>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Popular skills */}
        <AnimatePresence>
          {!query && !hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex gap-2 overflow-x-auto mt-4 pb-2 -mx-4 px-4"
            >
              {popularSkills.map((skill, i) => (
                <motion.button
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 20 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuery(skill)}
                  className="flex-shrink-0"
                >
                  <SkillBadge variant="secondary" className="cursor-pointer">
                    {skill}
                  </SkillBadge>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filter Sheet */}
      <SearchFilters
        isOpen={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        filters={filters}
        onFiltersChange={setFilters}
        colleges={colleges}
      />

      {/* Results */}
      <div className="px-4 py-6">
        <AnimatePresence mode="wait">
          {(query || hasActiveFilters) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between mb-4"
            >
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-muted-foreground"
              >
                {filteredProfiles.length} result
                {filteredProfiles.length !== 1 ? "s" : ""} found
              </motion.p>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "relevance" | "trust_score")}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="trust_score">Trust Score</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProfiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 25 }}
              whileHover={{ y: -3, boxShadow: "0 8px 25px -8px hsl(var(--primary) / 0.12)" }}
            >
              <ProfileCard
                {...profile}
                onViewPortfolio={handleViewPortfolio}
              />
            </motion.div>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="h-20 w-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4"
            >
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </motion.div>
            <h3 className="font-semibold text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your filters or search for different skills
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

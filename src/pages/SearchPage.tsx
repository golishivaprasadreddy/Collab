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
  Users,
  Sparkles,
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
  "React & Next.js",
  "Python & AI",
  "UI/UX Design",
  "Machine Learning",
  "Flutter Mobile",
  "Node.js Backend",
  "Figma",
  "TypeScript",
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
        college: profile.college || "Unknown College",
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
        fuzzyMatch(query, profile.name) ||
        fuzzyMatch(query, profile.college);

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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Searching talent directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header & Search Bar section */}
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Find peers across campus
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search students by skill, name, or university.
              </p>
            </div>

            {/* Sort & Filter Controls */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "relevance" | "trust_score")}>
                <SelectTrigger className="w-[140px] h-10 text-xs bg-background">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Sort: Relevance</SelectItem>
                  <SelectItem value="trust_score">Sort: Trust Score</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className={`h-10 px-3.5 text-xs font-medium gap-2 bg-background transition-all ${
                  hasActiveFilters ? "border-primary text-primary bg-primary/[0.04]" : ""
                }`}
                onClick={() => setIsFilterOpen(true)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Button>
            </div>
          </div>

          {/* Primary Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by skills (e.g. React, Python), college, or student name..."
              className="pl-12 pr-11 h-13 text-base bg-background border-border/80 rounded-2xl shadow-xs focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              autoFocus
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Active Filter Badges */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/60"
              >
                <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
                {filters.level !== "All Levels" && (
                  <SkillBadge variant="default" size="sm" className="gap-1.5">
                    <span>Level: {filters.level}</span>
                    <button onClick={() => setFilters({ ...filters, level: "All Levels" })} className="hover:opacity-75">
                      <X className="h-3 w-3" />
                    </button>
                  </SkillBadge>
                )}
                {filters.availability !== "All" && (
                  <SkillBadge variant="default" size="sm" className="gap-1.5">
                    <span>Availability: {filters.availability}</span>
                    <button onClick={() => setFilters({ ...filters, availability: "All" })} className="hover:opacity-75">
                      <X className="h-3 w-3" />
                    </button>
                  </SkillBadge>
                )}
                {filters.college && (
                  <SkillBadge variant="default" size="sm" className="gap-1.5 max-w-[220px]">
                    <span className="truncate">College: {filters.college}</span>
                    <button onClick={() => setFilters({ ...filters, college: "" })} className="hover:opacity-75 flex-shrink-0">
                      <X className="h-3 w-3" />
                    </button>
                  </SkillBadge>
                )}
                <button
                  onClick={() => setFilters({ level: "All Levels", availability: "All", college: "" })}
                  className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
                >
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popular Skill Chips */}
          {!query && !hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground font-medium">Quick search:</span>
              {popularSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => setQuery(skill.split(" ")[0])}
                  className="rounded-xl border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Sheet Modal */}
        <SearchFilters
          isOpen={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          filters={filters}
          onFiltersChange={setFilters}
          colleges={colleges}
        />

        {/* Results Counter */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-medium text-muted-foreground">
            Showing <span className="font-bold text-foreground">{filteredProfiles.length}</span> verified student{filteredProfiles.length !== 1 ? "s" : ""}
          </p>
          {query && (
            <p className="text-xs text-muted-foreground">
              Results for "<span className="font-semibold text-foreground">{query}</span>"
            </p>
          )}
        </div>

        {/* Responsive Grid: 1 col on mobile, 2 on tablet, 3 on laptop, 4 on wide screen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProfiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <ProfileCard
                {...profile}
                onViewPortfolio={handleViewPortfolio}
              />
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {filteredProfiles.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-3xl border border-border p-12 text-center max-w-md mx-auto my-8 shadow-xs"
          >
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-foreground text-base mb-1">No matching profiles found</h3>
            <p className="text-muted-foreground text-xs leading-relaxed mb-6">
              We couldn't find any student profiles matching "{query || 'your filters'}". Try broadening your search or resetting active filters.
            </p>
            <div className="flex justify-center gap-2">
              {query && (
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setQuery("")}>
                  Clear search query
                </Button>
              )}
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setFilters({ level: "All Levels", availability: "All", college: "" })}>
                  Reset all filters
                </Button>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ProfileCard } from "@/components/ui/profile-card";
import { SkillBadge } from "@/components/ui/skill-badge";
import { TrendingUp, Star, Search, Loader2 } from "lucide-react";
import { useProfiles } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";

const trendingSkills = [
  { name: "AI/ML", growth: "+24%" },
  { name: "Web3", growth: "+18%" },
  { name: "Flutter", growth: "+15%" },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profiles, isLoading } = useProfiles();

  // Get current user's profile to extract name
  const currentUserProfile = profiles?.find((p) => p.id === user?.id);
  const userName = currentUserProfile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  // Filter out current user from profiles list
  const otherProfiles = profiles?.filter((p) => p.id !== user?.id) || [];

  // Transform profiles to match ProfileCard format
  const formattedProfiles = otherProfiles.map((profile) => ({
    id: profile.id,
    name: profile.full_name || "Anonymous",
    college: profile.college || "Unknown College",
    skills: profile.skills.map((s) => ({
      name: s.skill_name,
      level: (s.level.charAt(0).toUpperCase() + s.level.slice(1)) as "Beginner" | "Intermediate" | "Advanced",
    })),
    points: profile.reputation?.points || 0,
    trustScore: profile.reputation?.trust_score ? Number(profile.reputation.trust_score) : undefined,
    completedCollabs: profile.reputation?.total_collaborations || 0,
    isPaidAvailable: profile.is_paid_available || false,
  }));

  // Get top contributors by points
  const topContributors = [...formattedProfiles]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  // Get unique skills for "recently searched" simulation
  const recentSearchedSkills = [
    ...new Set(formattedProfiles.flatMap((p) => p.skills.map((s) => s.name))),
  ].slice(0, 3);

  const handleViewPortfolio = (id: string) => {
    navigate(`/profile/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <div className="gradient-hero px-6 pt-12 pb-8 rounded-b-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-primary-foreground">
            Hi, {userName} 👋
          </h1>
          <p className="text-primary-foreground/80 mt-1">
            Discover your next collaboration
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate("/search")}
          className="mt-6 w-full bg-primary-foreground/20 backdrop-blur-sm rounded-xl h-12 px-4 flex items-center gap-3 text-primary-foreground/70"
        >
          <Search className="h-5 w-5" />
          <span>Search skills or people...</span>
        </motion.button>
      </div>

      <div className="px-4 pt-6 space-y-8">
        {/* Recently searched skills */}
        {recentSearchedSkills.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Popular skills
            </h2>
            <div className="flex gap-2 flex-wrap">
              {recentSearchedSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => navigate(`/search?skill=${skill}`)}
                >
                  <SkillBadge className="cursor-pointer hover:scale-105 transition-transform">
                    {skill}
                  </SkillBadge>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {formattedProfiles.slice(0, 2).map((profile) => (
                <ProfileCard
                  key={profile.id}
                  {...profile}
                  onViewPortfolio={handleViewPortfolio}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Trending skills */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">
              Trending skills this week
            </h2>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {trendingSkills.map((skill) => (
              <button
                key={skill.name}
                onClick={() => navigate(`/search?skill=${skill.name}`)}
                className="flex-shrink-0 bg-card p-4 rounded-xl border border-border shadow-card min-w-[120px] hover:border-primary/50 transition-colors"
              >
                <span className="text-sm font-medium text-foreground block">
                  {skill.name}
                </span>
                <span className="text-xs text-success mt-1 block">
                  {skill.growth}
                </span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Top contributors */}
        {topContributors.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-warning fill-warning" />
              <h2 className="text-lg font-semibold text-foreground">
                Top contributors
              </h2>
            </div>

            <div className="space-y-3">
              {topContributors.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => handleViewPortfolio(profile.id)}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? "bg-warning/20 text-warning"
                        : index === 1
                        ? "bg-muted text-muted-foreground"
                        : "bg-accent/20 text-accent"
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {profile.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile.college}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    <span className="font-semibold text-foreground">
                      {profile.points}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* All profiles */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Discover collaborators
          </h2>
          {formattedProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formattedProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  {...profile}
                  onViewPortfolio={handleViewPortfolio}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No other collaborators yet. Be the first to complete your profile!
              </p>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

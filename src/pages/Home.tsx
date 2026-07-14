import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ProfileCard } from "@/components/ui/profile-card";
import { SkillBadge } from "@/components/ui/skill-badge";
import { ArrowRight, Compass, Loader2, Search, Sparkles, Star, TrendingUp, Users, Zap } from "lucide-react";
import { useProfiles } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";

const trendingSkills = [
  { name: "AI/ML", growth: "+24%" },
  { name: "Web3", growth: "+18%" },
  { name: "Flutter", growth: "+15%" },
  { name: "Product Design", growth: "+12%" },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profiles, isLoading } = useProfiles();

  const currentUserProfile = profiles?.find((p) => p.id === user?.id);
  const userName = currentUserProfile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  const otherProfiles = profiles?.filter((p) => p.id !== user?.id) || [];

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

  const topContributors = [...formattedProfiles]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  const recentSearchedSkills = [
    ...new Set(formattedProfiles.flatMap((p) => p.skills.map((s) => s.name))),
  ].slice(0, 4);

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(108,123,255,0.18),_transparent_50%),radial-gradient(circle_at_100%_20%,_rgba(127,216,255,0.15),_transparent_20%)] pb-24">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[32px] border border-white/20 bg-gradient-to-br from-[#5F6DFF] via-[#8A5CFF] to-[#50C4E0] p-6 text-white shadow-[0_30px_80px_-35px_rgba(90,93,255,0.7)]"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                <span>Collaboration meets learning</span>
              </div>
              <h1 className="text-3xl font-semibold sm:text-4xl">
                Hi, {userName}. Ready to spark better teamwork?
              </h1>
              <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
                Discover collaborators, learn meaningful skills, and join projects that elevate your student experience.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/search")}
                className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/25"
              >
                <Search className="h-4 w-4" />
                Explore people
              </button>
              <button
                onClick={() => navigate("/events")}
                className="flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <Compass className="h-4 w-4" />
                Browse events
              </button>
            </div>
          </div>

          <motion.button
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            onClick={() => navigate("/search")}
            className="mt-6 flex w-full items-center gap-3 rounded-[22px] border border-white/20 bg-white/10 px-4 py-3 text-left text-sm text-white/90 shadow-sm backdrop-blur transition hover:bg-white/15"
          >
            <Search className="h-5 w-5" />
            <span>Search skills, projects, or people...</span>
            <ArrowRight className="ml-auto h-4 w-4" />
          </motion.button>
        </motion.header>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-4 w-4 text-[#5F6DFF]" />
              <span className="text-sm font-medium text-foreground">Active profiles</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-foreground">{formattedProfiles.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Ready to collaborate across campus.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-accent">
              <TrendingUp className="h-4 w-4 text-[#50C4E0]" />
              <span className="text-sm font-medium text-foreground">Trending skills</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-foreground">{trendingSkills.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Skills gaining momentum this week.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-warning">
              <Zap className="h-4 w-4 text-[#F8B040]" />
              <span className="text-sm font-medium text-foreground">Top contributors</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-foreground">{topContributors.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">High-impact teammates in the network.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-[24px] border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Popular skills</h2>
                <p className="text-sm text-muted-foreground">The capabilities people are using to launch projects.</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">Live</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {recentSearchedSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => navigate(`/search?skill=${skill}`)}
                  className="rounded-full border border-border bg-muted/70 px-3 py-2 text-sm text-foreground transition hover:border-primary/50 hover:bg-primary/10"
                >
                  {skill}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {formattedProfiles.slice(0, 2).map((profile) => (
                <ProfileCard
                  key={profile.id}
                  {...profile}
                  onViewPortfolio={handleViewPortfolio}
                />
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[24px] border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-warning fill-warning" />
              <h2 className="text-lg font-semibold text-foreground">Top contributors</h2>
            </div>

            <div className="mt-4 space-y-3">
              {topContributors.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 + index * 0.08 }}
                  onClick={() => handleViewPortfolio(profile.id)}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3 transition hover:border-primary/50 hover:bg-primary/5"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0
                        ? "bg-warning/20 text-warning"
                        : index === 1
                        ? "bg-muted text-muted-foreground"
                        : "bg-accent/20 text-accent"
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-foreground">{profile.name}</h3>
                    <p className="truncate text-sm text-muted-foreground">{profile.college}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    {profile.points}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mt-6 rounded-[24px] border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Discover collaborators</h2>
              <p className="text-sm text-muted-foreground">Browse inspiring profiles and connect with people who match your goals.</p>
            </div>
            <button
              onClick={() => navigate("/search")}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary/60 hover:bg-primary/10"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Explore more
            </button>
          </div>

          {formattedProfiles.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {formattedProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  {...profile}
                  onViewPortfolio={handleViewPortfolio}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/70 py-12 text-center">
              <p className="text-muted-foreground">No other collaborators yet. Be the first to complete your profile.</p>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

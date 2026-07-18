import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ProfileCard } from "@/components/ui/profile-card";
import { ArrowRight, Compass, Loader2, Search, Users, CheckCircle2, MapPin } from "lucide-react";
import { useProfiles } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profiles, isLoading } = useProfiles();

  const currentUserProfile = profiles?.find((p) => p.id === user?.id);
  const userName = currentUserProfile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "friend";
  const otherProfiles = profiles?.filter((p) => p.id !== user?.id) || [];

  const formattedProfiles = otherProfiles.map((profile) => ({
    id: profile.id,
    name: profile.full_name || "Student",
    college: profile.college || "Campus Network",
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
    .sort((a, b) => (b.trustScore || b.points) - (a.trustScore || a.points))
    .slice(0, 4);

  const recentSkills = [...new Set(formattedProfiles.flatMap((p) => p.skills.map((s) => s.name)))].slice(0, 6);

  const handleViewPortfolio = (id: string) => navigate(`/profile/${id}`);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Loading campus network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-12 bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

        {/* Hero Card with Restored Image Banner & Simple Daily Campus Language */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-xs grid lg:grid-cols-12"
        >
          {/* Left Text & Search Area */}
          <div className="p-6 sm:p-8 lg:col-span-7 flex flex-col justify-between z-10 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground leading-snug">
                Hey {userName}, ready to build?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
                Find teammates across Indian college campuses for your next hackathon, startup idea, or final year project.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Simple Search & Event Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/search")}
                  className="flex-1 flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-sm text-muted-foreground hover:border-foreground/30 transition-colors"
                >
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">Search by tech stack, college, or name...</span>
                </button>
                <button
                  onClick={() => navigate("/events")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  <Compass className="h-4 w-4" />
                  <span>Campus Events</span>
                </button>
              </div>

              {/* Quick Tech Stack Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-xs text-muted-foreground mr-1">Popular tech:</span>
                {(recentSkills.length > 0 ? recentSkills : ["React", "Python", "UI/UX Design", "Machine Learning", "Flutter"]).slice(0, 5).map((skill) => (
                  <button
                    key={skill}
                    onClick={() => navigate(`/search?skill=${encodeURIComponent(skill)}`)}
                    className="px-2.5 py-1 rounded-md text-xs bg-muted/60 hover:bg-muted text-foreground font-medium transition-colors border border-border/50"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Image Feature Area */}
          <div className="relative lg:col-span-5 min-h-[220px] sm:min-h-[280px] lg:min-h-full overflow-hidden bg-muted">
            <img
              src="/collab-hero.png"
              alt="Students working together on campus"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            {/* Subtle gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent lg:bg-gradient-to-r lg:from-card lg:via-transparent lg:to-transparent opacity-85" />
            
            {/* Small simple badge on the image */}
            <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 bg-background/90 backdrop-blur-md p-3 rounded-xl border border-border/80 shadow-sm max-w-[220px]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold text-xs flex-shrink-0">
                  ✓
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">Verified Students</p>
                  <p className="text-[10px] text-muted-foreground truncate">Real campus profiles</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Simple Grounded Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Active peers online", value: formattedProfiles.length || 18, desc: "Ready to join projects right now", icon: Users },
            { label: "Projects shipped", value: "48+", desc: "Built by teams across campuses", icon: CheckCircle2 },
            { label: "Partner colleges", value: "15+", desc: "IIT, NIT, BITS & top universities", icon: MapPin },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-4 border border-border shadow-xs flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground/80 mt-0.5">{stat.desc}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">

          {/* Left Column: Recommended peers */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div>
                <h2 className="text-base font-semibold">Teammates looking for projects</h2>
                <p className="text-xs text-muted-foreground">Peers matching popular campus tech stacks</p>
              </div>
              <button
                onClick={() => navigate("/search")}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Browse all</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {formattedProfiles.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {formattedProfiles.slice(0, 6).map((profile) => (
                  <ProfileCard key={profile.id} {...profile} onViewPortfolio={handleViewPortfolio} />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-10 text-center space-y-2">
                <Users className="h-6 w-6 text-muted-foreground mx-auto opacity-50" />
                <p className="text-sm font-medium">No other peers listed right now</p>
                <p className="text-xs text-muted-foreground">Check back once more students set up their profile.</p>
              </div>
            )}

            {/* Restored Team Image Feature with Simple Daily Language */}
            <div className="rounded-xl bg-card border border-border overflow-hidden grid sm:grid-cols-12 shadow-xs">
              <div className="sm:col-span-7 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Need a dev or designer for your idea?</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Whether you're preparing for a weekend hackathon or building your final year project, post a requirement with exactly what tech stack you need.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/requests")}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Post a project requirement</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="sm:col-span-5 relative min-h-[150px] bg-muted">
                <img
                  src="/collab-team.png"
                  alt="Student peers collaborating"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Top scores */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <div>
                  <span className="text-xs font-semibold block">Top trusted peers</span>
                  <span className="text-[10px] text-muted-foreground block">Verified by project leaders</span>
                </div>
                <button
                  onClick={() => navigate("/leaderboard")}
                  className="text-[11px] text-primary font-medium hover:underline"
                >
                  View rank
                </button>
              </div>

              <div className="divide-y divide-border/50">
                {topContributors.length > 0 ? (
                  topContributors.map((profile, idx) => (
                    <div
                      key={profile.id}
                      onClick={() => handleViewPortfolio(profile.id)}
                      className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-mono text-muted-foreground w-4 text-center font-bold">
                          {idx + 1}.
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{profile.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{profile.college}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span className="text-xs font-semibold">
                          {profile.trustScore ? profile.trustScore.toFixed(1) : profile.points}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">No scores recorded yet.</p>
                )}
              </div>
            </div>

            {/* Simple Daily Help Box */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
              <h4 className="text-xs font-semibold text-foreground">Want more invites?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Make sure you add your GitHub link and at least 3 skills like React, Python, or Figma on your setup page.
              </p>
              <button
                onClick={() => navigate("/setup")}
                className="text-xs font-semibold text-primary hover:underline block pt-1"
              >
                Complete profile setup &rarr;
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

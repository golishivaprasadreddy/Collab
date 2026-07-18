import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SkillBadge } from "@/components/ui/skill-badge";
import { Switch } from "@/components/ui/switch";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FullScreenAvatar } from "@/components/FullScreenAvatar";
import {
  Star,
  Trophy,
  CheckCircle2,
  Settings,
  Edit,
  Award,
  Target,
  IndianRupee,
  Wallet,
  Loader2,
  Users,
  Share2,
  Github,
  ExternalLink,
  MapPin,
  Calendar,
  BookOpen,
} from "lucide-react";
import { useProfile, useUpdateProfile, useProfiles } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileCard } from "@/components/ui/profile-card";
import { PortfolioShowcase } from "@/components/portfolio/PortfolioShowcase";

const collaborationTypeColors: Record<string, string> = {
  learning: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  project: "bg-purple-500/10 text-purple-600 border border-purple-500/20",
  paid: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
};

const badgeIcons: Record<string, string> = {
  "Rising Star": "⭐",
  "Team Player": "🤝",
  "Quick Responder": "⚡",
  "Top Earner": "💰",
  "Mentor": "🎓",
  "Verified": "✓",
};

export default function Portfolio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.id);
  const { data: allProfiles = [], isLoading: isLoadingProfiles } = useProfiles();
  const updateProfile = useUpdateProfile();

  // Fetch collaboration history
  const { data: collaborationHistory = [] } = useQuery({
    queryKey: ["collaboration-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: collabs, error } = await supabase
        .from("collaboration_requests")
        .select("*")
        .or(`requester_id.eq.${user.id},requestee_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const partnerIds = collabs.map((c) =>
        c.requester_id === user.id ? c.requestee_id : c.requester_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", partnerIds);

      const completedIds = collabs
        .filter((c) => c.status === "completed")
        .map((c) => c.id);

      const { data: ratings } = await supabase
        .from("ratings")
        .select("*")
        .in("collaboration_request_id", completedIds)
        .eq("rated_user_id", user.id);

      return collabs.map((collab) => {
        const partnerId = collab.requester_id === user.id ? collab.requestee_id : collab.requester_id;
        const partner = profiles?.find((p) => p.id === partnerId);
        const rating = ratings?.find((r) => r.collaboration_request_id === collab.id);

        return {
          id: collab.id,
          title: collab.purpose || "Collaboration",
          partner: partner?.full_name || "Unknown",
          skill: collab.skill_needed,
          status: collab.status,
          rating: rating?.score || 0,
          date: new Date(collab.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          type: collab.collaboration_type,
          earnings: collab.collaboration_type === "paid" && collab.status === "completed"
            ? collab.agreed_amount || 0
            : 0,
        };
      });
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Profile not found</p>
        <Button onClick={() => navigate("/setup")}>Create Profile</Button>
      </div>
    );
  }

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  const availabilityList = [
    profile.availability?.learning && "Learning collaboration",
    profile.availability?.project && "Project collaboration",
    profile.availability?.paid_collaboration && "Paid collaboration",
  ].filter(Boolean) as string[];

  const handlePaidToggle = async (enabled: boolean) => {
    await updateProfile.mutateAsync({
      availability: { paid_collaboration: enabled },
    });
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/u/${user?.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.full_name}'s Profile`,
          text: `Check out ${profile.full_name}'s skills on Collabio`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Profile link copied to clipboard.",
        });
      }
    } catch {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12">
      {/* Clean Cover Header */}
      <div className="h-36 sm:h-48 lg:h-56 bg-muted border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end justify-end pb-4">
          <button
            onClick={() => navigate("/settings")}
            className="h-9 px-3 rounded-lg bg-background/80 hover:bg-background border border-border/80 shadow-xs flex items-center gap-2 text-xs font-semibold text-foreground transition-all"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Profile Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10">
        <div className="grid gap-8 lg:grid-cols-12">

          {/* Left Column: User Card & Basic Details */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col items-center text-center"
            >
              {user?.id && (
                <div className="-mt-16 mb-4 relative">
                  <FullScreenAvatar src={profile.avatar_url} fallback={initials}>
                    <AvatarUpload
                      userId={user.id}
                      currentAvatarUrl={profile.avatar_url}
                      initials={initials}
                      size="lg"
                    />
                  </FullScreenAvatar>
                </div>
              )}

              <h1 className="text-xl font-bold text-foreground leading-snug">
                {profile.full_name || "Anonymous"}
              </h1>

              {profile.degree && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground mt-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{profile.degree}, {profile.year}</span>
                </div>
              )}

              {profile.college && (
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground/80 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{profile.college}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2.5 w-full mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs font-semibold"
                  onClick={() => navigate("/setup")}
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit Profile
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 px-3 text-xs font-semibold"
                  onClick={handleShareProfile}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Stats Grid inside Card */}
              <div className="grid grid-cols-4 gap-2 w-full mt-6 pt-6 border-t border-border/60">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-foreground">
                      {profile.reputation?.points || 0}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">Points</span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      {Number(profile.reputation?.trust_score || 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">Trust</span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <Target className="h-3.5 w-3.5 text-accent" />
                    <span className="text-sm font-bold text-foreground">
                      {profile.reputation?.total_collaborations || 0}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">Collabs</span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-600">
                      {((profile.reputation?.total_earnings || 0) / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">Earned</span>
                </div>
              </div>
            </motion.div>

            {/* Paid Availability Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-4 border border-border shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Paid Collaboration</p>
                  <p className="text-[11px] text-muted-foreground">Accept requests for paid gigs</p>
                </div>
              </div>
              <Switch
                checked={profile.availability?.paid_collaboration || false}
                onCheckedChange={handlePaidToggle}
                disabled={updateProfile.isPending}
              />
            </motion.div>

            {/* Availability Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-2xl p-5 border border-border shadow-xs space-y-3"
            >
              <h3 className="font-semibold text-sm text-foreground">Current Availability</h3>
              <div className="space-y-2">
                {availabilityList.length > 0 ? (
                  availabilityList.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-xs font-medium text-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Not currently open to collaborations</p>
                )}
              </div>
            </motion.div>

            {/* GitHub Profile Box */}
            {profile.github_url && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl p-4 border border-border shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Github className="h-4 w-4" />
                    GitHub Verified
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline truncate block"
                >
                  {profile.github_url}
                </a>
              </motion.div>
            )}
          </div>

          {/* Right Column: Skills, Badges, Showcase & History */}
          <div className="lg:col-span-8 space-y-6">

            {/* Badges Earned */}
            {profile.reputation?.badges && profile.reputation.badges.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-5 border border-border shadow-xs"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-sm text-foreground">Reputation Badges</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {profile.reputation.badges.map((badge) => (
                    <div
                      key={badge}
                      className="rounded-xl bg-muted/50 border border-border/80 p-3 text-center"
                    >
                      <span className="text-2xl block mb-1">{badgeIcons[badge] || "🏅"}</span>
                      <span className="text-xs font-semibold text-foreground">{badge}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* My Skills Section */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-5 border border-border shadow-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-foreground">Verified Skills</h3>
                <span className="text-xs text-muted-foreground">{profile.skills.length} skills listed</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <SkillBadge key={skill.id} level={skill.level}>
                      {skill.skill_name}
                    </SkillBadge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-2">No skills added yet. Add skills to attract teammates!</p>
                )}
              </div>
            </motion.section>

            {/* Portfolio Showcase */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {user?.id && <PortfolioShowcase userId={user.id} isOwner={true} />}
            </motion.section>

            {/* Collaboration History */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-5 border border-border shadow-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-foreground">Collaboration History</h3>
                <span className="text-xs text-muted-foreground">{collaborationHistory.length} total records</span>
              </div>

              <div className="space-y-3">
                {collaborationHistory.length > 0 ? (
                  collaborationHistory.map((collab) => (
                    <div
                      key={collab.id}
                      className="rounded-xl border border-border/80 bg-background p-4 transition-all hover:border-border"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm text-foreground">{collab.title}</h4>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${collaborationTypeColors[collab.type] || ""}`}>
                              {collab.type.charAt(0).toUpperCase() + collab.type.slice(1)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            with <span className="font-medium text-foreground">{collab.partner}</span> • {collab.date}
                          </p>
                          <div className="mt-2.5">
                            <SkillBadge size="sm">{collab.skill}</SkillBadge>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
                          {collab.status === "completed" ? (
                            <div className="flex sm:flex-col items-center sm:items-end gap-2">
                              {collab.rating > 0 && (
                                <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                  <span>{collab.rating}</span>
                                </div>
                              )}
                              {collab.earnings > 0 && (
                                <div className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                  <IndianRupee className="h-3 w-3" />
                                  <span>{collab.earnings.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold bg-muted px-2.5 py-1 rounded-md text-foreground">
                              {collab.status.charAt(0).toUpperCase() + collab.status.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl">
                    <p className="text-xs text-muted-foreground font-medium">No collaborations recorded yet</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs text-primary mt-1"
                      onClick={() => navigate("/search")}
                    >
                      Find collaborators to work with &rarr;
                    </Button>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Discover More Collaborators */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card rounded-2xl p-5 border border-border shadow-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">Other Campus Collaborators</h3>
                </div>
                <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => navigate("/search")}>
                  View all &rarr;
                </Button>
              </div>

              {isLoadingProfiles ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allProfiles
                    .filter((p) => p.id !== user?.id)
                    .slice(0, 6)
                    .map((p) => (
                      <ProfileCard
                        key={p.id}
                        id={p.id}
                        name={p.full_name || "Anonymous"}
                        college={p.college || undefined}
                        skills={p.skills.map((s) => ({
                          name: s.skill_name,
                          level: (s.level.charAt(0).toUpperCase() + s.level.slice(1)) as "Beginner" | "Intermediate" | "Advanced",
                        }))}
                        points={p.reputation?.points || 0}
                        isPaidAvailable={p.is_paid_available || false}
                        onViewPortfolio={(id) => navigate(`/profile/${id}`)}
                      />
                    ))}
                  {allProfiles.filter((p) => p.id !== user?.id).length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <p className="text-xs">No other collaborators registered yet.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.section>

          </div>
        </div>
      </div>
    </div>
  );
}

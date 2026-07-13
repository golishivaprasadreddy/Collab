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
} from "lucide-react";
import { useProfile, useUpdateProfile, useProfiles } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileCard } from "@/components/ui/profile-card";
import { PortfolioShowcase } from "@/components/portfolio/PortfolioShowcase";

const collaborationTypeColors: Record<string, string> = {
  learning: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  project: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  paid: "bg-success/10 text-success",
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

      // Get partner profiles
      const partnerIds = collabs.map((c) =>
        c.requester_id === user.id ? c.requestee_id : c.requester_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", partnerIds);

      // Get ratings for completed collaborations
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-hero px-4 pt-12 pb-20 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">
              My Portfolio
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              Your skill portfolio
            </p>
          </div>
          <button
            onClick={() => navigate("/settings")}
            className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-16">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border"
        >
          {/* Avatar and basic info - centered layout */}
          <div className="flex flex-col items-center text-center">
            {user?.id && (
              <div className="-mt-16 mb-4">
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

            <h2 className="text-xl font-bold text-foreground">
              {profile.full_name || "Anonymous"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {profile.degree}, {profile.year}
            </p>
            <p className="text-sm text-muted-foreground">
              {profile.college}
            </p>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/setup")}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShareProfile}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-4 w-4 text-warning fill-warning" />
                <span className="text-lg font-bold text-foreground">
                  {profile.reputation?.points || 0}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Points</span>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold text-foreground">
                  {Number(profile.reputation?.trust_score || 0).toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Trust</span>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-lg font-bold text-foreground">
                  {profile.reputation?.total_collaborations || 0}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Collabs</span>
            </div>

            <div className="text-center p-3 bg-success/10 rounded-xl">
              <div className="flex items-center justify-center gap-0.5 mb-1">
                <IndianRupee className="h-4 w-4 text-success" />
                <span className="text-lg font-bold text-success">
                  {((profile.reputation?.total_earnings || 0) / 1000).toFixed(1)}k
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Earned</span>
            </div>
          </div>
        </motion.div>

        {/* Paid availability toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-4 bg-card rounded-xl p-4 border border-border flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground">Paid collaboration</p>
              <p className="text-xs text-muted-foreground">Enable to receive paid requests</p>
            </div>
          </div>
          <Switch
            checked={profile.availability?.paid_collaboration || false}
            onCheckedChange={handlePaidToggle}
            disabled={updateProfile.isPending}
          />
        </motion.div>

        {/* Badges */}
        {profile.reputation?.badges && profile.reputation.badges.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              Badges Earned
            </h3>
            <div className="flex gap-3 flex-wrap">
              {profile.reputation.badges.map((badge) => (
                <div
                  key={badge}
                  className="bg-card rounded-xl p-4 border border-border text-center min-w-[80px]"
                >
                  <span className="text-2xl block mb-1">{badgeIcons[badge] || "🏅"}</span>
                  <span className="text-xs font-medium text-foreground">
                    {badge}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Skills */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <h3 className="font-semibold text-foreground mb-3">My Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.length > 0 ? (
              profile.skills.map((skill) => (
                <SkillBadge key={skill.id} level={skill.level}>
                  {skill.skill_name}
                </SkillBadge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No skills added yet</p>
            )}
          </div>
        </motion.section>

        {/* Availability */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <h3 className="font-semibold text-foreground mb-3">Available for</h3>
          <div className="space-y-2">
            {availabilityList.length > 0 ? (
              availabilityList.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {item}
                  {item.includes("Paid") && (
                    <span className="text-success font-medium">💰</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Not available for collaborations</p>
            )}
          </div>
        </motion.section>

        {/* GitHub Profile */}
        {profile.github_url && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="mt-6"
          >
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Profile
            </h3>
            <a
              href={profile.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-foreground/10 flex items-center justify-center">
                <Github className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{profile.github_url}</p>
                <p className="text-xs text-muted-foreground">View GitHub profile</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </a>
          </motion.section>
        )}

        {/* Portfolio Showcase */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6"
        >
          {user?.id && (
            <PortfolioShowcase userId={user.id} isOwner={true} />
          )}
        </motion.section>

        {/* Collaboration history */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h3 className="font-semibold text-foreground mb-3">
            Collaboration History
          </h3>
          <div className="space-y-3">
            {collaborationHistory.length > 0 ? (
              collaborationHistory.map((collab) => (
                <div
                  key={collab.id}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-foreground">
                          {collab.title}
                        </h4>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${collaborationTypeColors[collab.type] || ""}`}>
                          {collab.type.charAt(0).toUpperCase() + collab.type.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        with {collab.partner}
                      </p>
                      <SkillBadge size="sm" className="mt-2">
                        {collab.skill}
                      </SkillBadge>
                    </div>
                    <div className="text-right ml-4">
                      {collab.status === "completed" ? (
                        <>
                          {collab.rating > 0 && (
                            <div className="flex items-center gap-1 justify-end">
                              <Star className="h-4 w-4 text-warning fill-warning" />
                              <span className="font-medium">{collab.rating}</span>
                            </div>
                          )}
                          {collab.earnings > 0 && (
                            <div className="flex items-center gap-0.5 text-success text-sm font-medium mt-1 justify-end">
                              <IndianRupee className="h-3 w-3" />
                              {collab.earnings.toLocaleString()}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {collab.status.charAt(0).toUpperCase() + collab.status.slice(1)}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {collab.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No collaborations yet</p>
                <Button variant="link" onClick={() => navigate("/search")}>
                  Find collaborators
                </Button>
              </div>
            )}
          </div>
        </motion.section>

        {/* Discover All Profiles section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Discover Collaborators
            </h3>
          </div>
          
          {isLoadingProfiles ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {allProfiles
                .filter((p) => p.id !== user?.id)
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
                <div className="text-center py-8 text-muted-foreground">
                  <p>No other collaborators yet</p>
                  <Button variant="link" onClick={() => navigate("/search")}>
                    Search for collaborators
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

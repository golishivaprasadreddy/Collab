import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SkillBadge } from "@/components/ui/skill-badge";
import {
  Star,
  CheckCircle2,
  GraduationCap,
  IndianRupee,
  Loader2,
  Share2,
  LogIn,
  FolderKanban,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { usePortfolioProjects } from "@/hooks/usePortfolioProjects";
import { useToast } from "@/hooks/use-toast";
import { PortfolioShowcase } from "@/components/portfolio/PortfolioShowcase";

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile, isLoading } = useProfile(id);
  const { data: portfolioProjects = [] } = usePortfolioProjects(id);

  const handleShare = async () => {
    const url = `${window.location.origin}/u/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.full_name}'s Profile`,
          text: `Check out ${profile?.full_name}'s skills on Collabio`,
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
        <Button onClick={() => navigate("/")}>Go to Home</Button>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero px-4 pt-4 pb-20 relative">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-primary-foreground">Collabio</h1>
          <button
            onClick={handleShare}
            className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Profile content */}
      <div className="px-4 -mt-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border"
        >
          {/* Avatar and basic info */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 ring-4 ring-card -mt-16 mb-4">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-xl font-bold text-foreground">{profile.full_name || "Anonymous"}</h1>

            <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
              <GraduationCap className="h-4 w-4" />
              <span>
                {profile.degree}, {profile.year}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              {profile.college}
            </p>

            {profile.availability?.paid_collaboration && (
              <span className="mt-3 flex items-center gap-1 text-sm font-medium text-success bg-success/10 px-3 py-1 rounded-full">
                <IndianRupee className="h-4 w-4" />
                Paid collaboration available
              </span>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-6 py-4 border-y border-border w-full justify-center flex-wrap">
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <Star className="h-5 w-5 text-warning fill-warning" />
                  <span className="text-lg font-bold text-foreground">
                    {profile.reputation?.points || 0}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Points</span>
              </div>

              <div className="w-px h-8 bg-border" />

              <div className="text-center">
                <span className="text-lg font-bold text-foreground block">
                  {Number(profile.reputation?.trust_score || 0).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">Trust</span>
              </div>

              <div className="w-px h-8 bg-border" />

              <div className="text-center">
                <span className="text-lg font-bold text-foreground block">
                  {profile.reputation?.total_collaborations || 0}
                </span>
                <span className="text-xs text-muted-foreground">Collabs</span>
              </div>

              <div className="w-px h-8 bg-border" />

              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold text-foreground">
                    {portfolioProjects.length}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Projects</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-6">
              <h3 className="font-semibold text-foreground mb-2">About</h3>
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          <div className="mt-6">
            <h3 className="font-semibold text-foreground mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.length > 0 ? (
                profile.skills.map((skill) => (
                  <SkillBadge key={skill.id} level={skill.level}>
                    {skill.skill_name}
                  </SkillBadge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="mt-6">
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
          </div>

          {/* Portfolio Showcase */}
          {id && (
            <div className="mt-6">
              <PortfolioShowcase userId={id} isOwner={false} />
            </div>
          )}
        </motion.div>

        {/* Login CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 pb-8"
        >
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <h3 className="font-semibold text-foreground mb-2">
              Want to collaborate with {profile.full_name?.split(" ")[0]}?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join Collabio to send collaboration requests and connect with students.
            </p>
            <Button
              onClick={() => navigate("/signup")}
              className="w-full h-12 gradient-primary border-0"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Join Collabio
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

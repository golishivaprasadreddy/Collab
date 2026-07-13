import { useState } from "react";
import { FullScreenAvatar } from "@/components/FullScreenAvatar";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SkillBadge } from "@/components/ui/skill-badge";
import {
  ArrowLeft,
  Star,
  MessageCircle,
  Send,
  CheckCircle2,
  GraduationCap,
  IndianRupee,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useCreateCollaborationRequest, useCollaborationRequests } from "@/hooks/useCollaborations";
import { useAuth } from "@/contexts/AuthContext";
import { SkillBadgesDisplay } from "@/components/profile/SkillBadgesDisplay";
import { calculateProfileCompletion, DAILY_REQUEST_LIMIT } from "@/utils/profileCompletion";

const purposeOptions = [
  { value: "startup", label: "Startup idea" },
  { value: "college", label: "College project" },
  { value: "hackathon", label: "Hackathon" },
  { value: "learning", label: "Learning help" },
];

const durationOptions = [
  { value: "1week", label: "1 week" },
  { value: "2weeks", label: "2 weeks" },
  { value: "1month", label: "1 month" },
  { value: "3months", label: "3+ months" },
];

const collaborationTypes = [
  { value: "learning", label: "Learning", price: "₹0", icon: "📚" },
  { value: "project", label: "Project", price: "₹0", icon: "💼" },
  { value: "paid", label: "Paid collaboration", price: "💰", icon: "💰" },
];

export default function ProfileView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(id);
  const { data: myProfile } = useProfile(); // Current user's profile
  const { data: requestsData } = useCollaborationRequests();
  const createRequest = useCreateCollaborationRequest();

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestData, setRequestData] = useState({
    skill: "",
    purpose: "",
    description: "",
    duration: "",
    collaborationType: "learning" as "learning" | "project" | "paid",
    agreedAmount: "",
  });

  // Set default skill when profile loads
  if (profile?.skills?.[0] && !requestData.skill) {
    setRequestData((prev) => ({ ...prev, skill: profile.skills[0].skill_name }));
  }

  const handleSendRequest = async () => {
    // Check profile completion (70% required)
    const completion = calculateProfileCompletion(myProfile ?? null);
    if (!completion.isComplete) {
      toast({
        title: "Profile incomplete",
        description: `Your profile is ${completion.percentage}% complete. You need at least 70% to send requests. Missing: ${completion.missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Check daily request limit
    const today = new Date().toISOString().split("T")[0];
    const todaySentCount = (requestsData?.sent || []).filter(
      (r) => r.created_at.startsWith(today)
    ).length;
    if (todaySentCount >= DAILY_REQUEST_LIMIT) {
      toast({
        title: "Daily limit reached",
        description: `You can only send ${DAILY_REQUEST_LIMIT} requests per day. Try again tomorrow.`,
        variant: "destructive",
      });
      return;
    }

    if (!requestData.purpose || !requestData.description || !requestData.skill) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields including skill selection.",
        variant: "destructive",
      });
      return;
    }

    if (!id) return;

    try {
      await createRequest.mutateAsync({
        requestee_id: id,
        skill_needed: requestData.skill,
        purpose: requestData.purpose,
        description: requestData.description,
        duration: requestData.duration || undefined,
        collaboration_type: requestData.collaborationType,
        agreed_amount: requestData.collaborationType === "paid" 
          ? parseInt(requestData.agreedAmount) || undefined 
          : undefined,
      });

      toast({
        title: "Request sent! 🎉",
        description: `Your collaboration request has been sent to ${profile?.full_name}.`,
      });
      setIsRequestOpen(false);
      navigate("/requests");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again later.";
      toast({
        title: "Failed to send request",
        description: message,
        variant: "destructive",
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
        <Button onClick={() => navigate(-1)}>Go Back</Button>
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

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero px-4 pt-4 pb-20 relative">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
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
            <FullScreenAvatar src={profile.avatar_url} fallback={initials}>
              <Avatar className="h-24 w-24 ring-4 ring-card -mt-16 mb-4">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </FullScreenAvatar>

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
            <div className="flex items-center gap-6 mt-6 py-4 border-y border-border w-full justify-center">
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

          {/* Skill Badges */}
          {id && <SkillBadgesDisplay userId={id} />}

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
        </motion.div>

        {/* Action buttons */}
        {!isOwnProfile && (
          <div className="flex gap-3 mt-6 pb-8">
            <Sheet open={isRequestOpen} onOpenChange={setIsRequestOpen}>
              <SheetTrigger asChild>
                <Button className="flex-1 h-14 gradient-primary border-0 text-base">
                  <Send className="h-5 w-5 mr-2" />
                  Collaborate
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
                <SheetHeader className="pb-4">
                  <SheetTitle>Send Collaboration Request</SheetTitle>
                </SheetHeader>

                <div className="space-y-5 pb-8">
                  <div className="space-y-2">
                    <Label>Skill needed</Label>
                    <Select
                      value={requestData.skill}
                      onValueChange={(value) =>
                        setRequestData({ ...requestData, skill: value })
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select a skill" />
                      </SelectTrigger>
                      <SelectContent>
                        {profile.skills.map((skill) => (
                          <SelectItem key={skill.id} value={skill.skill_name}>
                            {skill.skill_name} ({skill.level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Purpose *</Label>
                    <Select
                      value={requestData.purpose}
                      onValueChange={(value) =>
                        setRequestData({ ...requestData, purpose: value })
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="What's this for?" />
                      </SelectTrigger>
                      <SelectContent>
                        {purposeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      placeholder="Describe what you need help with..."
                      className="min-h-[100px] resize-none"
                      value={requestData.description}
                      onChange={(e) =>
                        setRequestData({
                          ...requestData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expected duration</Label>
                    <Select
                      value={requestData.duration}
                      onValueChange={(value) =>
                        setRequestData({ ...requestData, duration: value })
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="How long?" />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Collaboration type</Label>
                    <RadioGroup
                      value={requestData.collaborationType}
                      onValueChange={(value) =>
                        setRequestData({ 
                          ...requestData, 
                          collaborationType: value as "learning" | "project" | "paid" 
                        })
                      }
                      className="space-y-3"
                    >
                      {collaborationTypes.map((type) => (
                        <div
                          key={type.value}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                            requestData.collaborationType === type.value
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                        >
                          <RadioGroupItem value={type.value} id={type.value} />
                          <label
                            htmlFor={type.value}
                            className="flex-1 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{type.icon}</span>
                              <span className="font-medium">{type.label}</span>
                            </div>
                            <span className={`text-sm font-medium ${
                              type.value === "paid" ? "text-success" : "text-muted-foreground"
                            }`}>
                              {type.price}
                            </span>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {requestData.collaborationType === "paid" && (
                    <div className="space-y-2">
                      <Label>Agreed Amount (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        className="h-12"
                        value={requestData.agreedAmount}
                        onChange={(e) =>
                          setRequestData({ ...requestData, agreedAmount: e.target.value })
                        }
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleSendRequest}
                    className="w-full h-14 gradient-primary border-0 text-base"
                    disabled={createRequest.isPending}
                  >
                    {createRequest.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    Send Request
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="icon" className="h-14 w-14" onClick={() => navigate("/messages")}>
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>
        )}

        {isOwnProfile && (
          <div className="mt-6 pb-8">
            <Button className="w-full h-14" variant="outline" onClick={() => navigate("/setup")}>
              Edit Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

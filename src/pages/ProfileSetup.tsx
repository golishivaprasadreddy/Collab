import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SkillBadge } from "@/components/ui/skill-badge";
import { Slider } from "@/components/ui/slider";
import { AvatarUpload } from "@/components/AvatarUpload";
import {
  Building2,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Check,
  IndianRupee,
  Loader2,
  Plus,
  Github,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpdateProfile, useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";

const availableSkills = [
  "React",
  "Python",
  "UI/UX Design",
  "Machine Learning",
  "Node.js",
  "Flutter",
  "Data Science",
  "Marketing",
  "Video Editing",
  "Photography",
  "Content Writing",
  "Graphic Design",
  "Project Management",
  "Public Speaking",
  "Blockchain",
  "iOS Development",
];

const availabilityOptions = [
  { id: "learning", label: "Learning collaboration", icon: "📚", earning: false },
  { id: "project", label: "Project collaboration", icon: "💼", earning: false },
  { id: "paid", label: "Paid collaboration", icon: "💰", earning: true },
];

const interestOptions = [
  { id: "startups", label: "Startups", icon: "🚀" },
  { id: "hackathons", label: "Hackathons", icon: "⚡" },
  { id: "college", label: "College projects", icon: "🎓" },
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: existingProfile } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [step, setStep] = useState(1);
  const [customSkill, setCustomSkill] = useState("");
  const [allSkills, setAllSkills] = useState<string[]>(availableSkills);
  const [formData, setFormData] = useState({
    avatar: "",
    bio: existingProfile?.bio || "",
    fullName: existingProfile?.full_name || "",
    college: existingProfile?.college || "",
    degree: existingProfile?.degree || "",
    year: existingProfile?.year || "",
    skills: [] as Array<{ name: string; level: "Beginner" | "Intermediate" | "Advanced" }>,
    availability: [] as string[],
    interests: [] as string[],
    earningRange: [500, 2500] as [number, number],
    githubUrl: existingProfile?.github_url || "",
  });

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !allSkills.includes(trimmed)) {
      setAllSkills([...allSkills, trimmed]);
      setFormData({
        ...formData,
        skills: [...formData.skills, { name: trimmed, level: "Intermediate" as const }],
      });
      setCustomSkill("");
    } else if (trimmed && allSkills.includes(trimmed)) {
      // If skill exists, just select it
      toggleSkill(trimmed);
      setCustomSkill("");
    }
  };

  const toggleSkill = (skillName: string) => {
    const existing = formData.skills.find((s) => s.name === skillName);
    if (existing) {
      setFormData({
        ...formData,
        skills: formData.skills.filter((s) => s.name !== skillName),
      });
    } else {
      setFormData({
        ...formData,
        skills: [
          ...formData.skills,
          { name: skillName, level: "Intermediate" as const },
        ],
      });
    }
  };

  const updateSkillLevel = (
    skillName: string,
    level: "Beginner" | "Intermediate" | "Advanced"
  ) => {
    setFormData({
      ...formData,
      skills: formData.skills.map((s) =>
        s.name === skillName ? { ...s, level } : s
      ),
    });
  };

  const toggleArrayItem = (
    key: "availability" | "interests",
    item: string
  ) => {
    const array = formData[key];
    if (array.includes(item)) {
      setFormData({
        ...formData,
        [key]: array.filter((i) => i !== item),
      });
    } else {
      setFormData({
        ...formData,
        [key]: [...array, item],
      });
    }
  };

  const handleFinish = async () => {
    try {
      await updateProfile.mutateAsync({
        profile: {
          full_name: formData.fullName,
          college: formData.college,
          degree: formData.degree,
          year: formData.year,
          bio: formData.bio || null,
          avatar_url: formData.avatar || null,
          is_paid_available: formData.availability.includes("paid"),
          min_earning_range: formData.earningRange[0],
          max_earning_range: formData.earningRange[1],
          github_url: formData.githubUrl || null,
        },
        skills: formData.skills.map((s) => ({
          skill_name: s.name,
          level: s.level.toLowerCase() as "beginner" | "intermediate" | "advanced",
        })),
        availability: {
          learning: formData.availability.includes("learning"),
          project: formData.availability.includes("project"),
          paid_collaboration: formData.availability.includes("paid"),
          interests: formData.interests,
        },
      });

      toast({
        title: "Profile complete! 🎉",
        description: "Start discovering collaborators now.",
      });
      navigate("/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      toast({
        title: "Failed to save profile",
        description: message,
        variant: "destructive",
      });
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.fullName && formData.college;
      case 2:
        return formData.skills.length > 0;
      case 3:
        return formData.availability.length > 0;
      default:
        return true;
    }
  };

  const isPaidEnabled = formData.availability.includes("paid");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <span className="text-sm text-muted-foreground ml-auto">
            Step {step} of 3
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground">
                  Basic Details
                </h2>
                <p className="text-muted-foreground mt-1">
                  Let others know who you are
                </p>
              </div>

              {/* Avatar upload */}
              <div className="flex justify-center">
                {user?.id && (
                  <AvatarUpload
                    userId={user.id}
                    currentAvatarUrl={formData.avatar || existingProfile?.avatar_url}
                    initials={formData.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                    onUploadComplete={(url) => setFormData({ ...formData, avatar: url })}
                    size="lg"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    className="h-12"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college">College / University</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="college"
                      placeholder="Your college name"
                      className="pl-11 h-12"
                      value={formData.college}
                      onChange={(e) =>
                        setFormData({ ...formData, college: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="degree">Degree</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="degree"
                        placeholder="e.g., B.Tech"
                        className="pl-11 h-12"
                        value={formData.degree}
                        onChange={(e) =>
                          setFormData({ ...formData, degree: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      placeholder="e.g., 3rd"
                      className="h-12"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub Profile</Label>
                  <div className="relative">
                    <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="githubUrl"
                      placeholder="https://github.com/username"
                      className="pl-11 h-12"
                      value={formData.githubUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, githubUrl: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About You</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell others a bit about yourself, your interests, and what you're looking for..."
                    className="min-h-[100px] resize-none"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.bio.length}/300
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Your Skills
                </h2>
                <p className="text-muted-foreground mt-1">
                  Select skills you can contribute
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill) => {
                  const selected = formData.skills.find(
                    (s) => s.name === skill
                  );
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="focus:outline-none"
                    >
                      <SkillBadge
                        variant={selected ? "default" : "outline"}
                        selected={!!selected}
                        className="cursor-pointer hover:scale-105 transition-transform"
                      >
                        {skill}
                        {selected && <Check className="ml-1 h-3 w-3" />}
                      </SkillBadge>
                    </button>
                  );
                })}
              </div>

              {/* Custom skill input */}
              <div className="mt-4 flex gap-2">
                <Input
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Add custom skill..."
                  className="h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSkill();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 flex-shrink-0"
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim()}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Can't find your skill? Type it above and press Enter or click +
              </p>

              {formData.skills.length > 0 && (
                <div className="space-y-4 mt-8">
                  <h3 className="font-medium text-foreground">
                    Set your skill levels
                  </h3>
                  {formData.skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="flex items-center justify-between p-4 bg-card rounded-xl border border-border"
                    >
                      <span className="font-medium">{skill.name}</span>
                      <div className="flex gap-2">
                        {(["Beginner", "Intermediate", "Advanced"] as const).map(
                          (level) => (
                            <button
                              key={level}
                              onClick={() => updateSkillLevel(skill.name, level)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                skill.level === level
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {level}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Availability, Intent & Earning
                </h2>
                <p className="text-muted-foreground mt-1">
                  What are you looking for?
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-foreground">
                  Available for
                </h3>
                <div className="space-y-3">
                  {availabilityOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleArrayItem("availability", option.id)}
                      className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        formData.availability.includes(option.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <span className="font-medium">{option.label}</span>
                        {option.earning && (
                          <span className="ml-2 text-xs text-success font-medium">
                            Earning enabled
                          </span>
                        )}
                      </div>
                      {formData.availability.includes(option.id) && (
                        <Check className="ml-auto h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-foreground">
                  Interests
                </h3>
                <div className="space-y-3">
                  {interestOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleArrayItem("interests", option.id)}
                      className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        formData.interests.includes(option.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                      {formData.interests.includes(option.id) && (
                        <Check className="ml-auto h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Earning range - only shown when paid collaboration is selected */}
              {isPaidEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Expected earning range
                    </h3>
                    <span className="text-xs text-muted-foreground">(Private)</span>
                  </div>
                  <div className="p-4 bg-card rounded-xl border border-border space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Range</span>
                      <span className="font-semibold text-foreground">
                        ₹{formData.earningRange[0]} – ₹{formData.earningRange[1]}
                      </span>
                    </div>
                    <Slider
                      value={formData.earningRange}
                      onValueChange={(value) =>
                        setFormData({ ...formData, earningRange: value as [number, number] })
                      }
                      min={500}
                      max={5000}
                      step={250}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>₹500</span>
                      <span>₹5,000</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom button */}
      <div className="p-6 border-t border-border">
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            className="w-full h-12 text-base gradient-primary border-0"
            disabled={!canProceed()}
          >
            Continue
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            className="w-full h-12 text-base gradient-primary border-0"
            disabled={!canProceed() || updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Finish Setup
                <Check className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

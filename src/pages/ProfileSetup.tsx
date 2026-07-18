import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { AvatarUpload } from "@/components/AvatarUpload";
import { useToast } from "@/hooks/use-toast";
import { useUpdateProfile, useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Loader2, Plus, X } from "lucide-react";

const commonSkills = [
  "React",
  "Next.js",
  "TypeScript",
  "Python",
  "Node.js",
  "Figma",
  "UI/UX Design",
  "Tailwind CSS",
  "Flutter",
  "Machine Learning",
  "Data Science",
  "PostgreSQL",
  "GraphQL",
  "C++",
  "Java",
  "Swift",
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: existingProfile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [step, setStep] = useState(1);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [allSkills, setAllSkills] = useState<string[]>(commonSkills);

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

  const handleAddSkill = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;

    if (!formData.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { name: trimmed, level: "Intermediate" }],
      });
      if (!allSkills.includes(trimmed)) {
        setAllSkills([...allSkills, trimmed]);
      }
    }
    setCustomSkillInput("");
  };

  const handleRemoveSkill = (skillName: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s.name !== skillName),
    });
  };

  const handleLevelChange = (skillName: string, level: "Beginner" | "Intermediate" | "Advanced") => {
    setFormData({
      ...formData,
      skills: formData.skills.map((s) => (s.name === skillName ? { ...s, level } : s)),
    });
  };

  const toggleOption = (key: "availability" | "interests", item: string) => {
    const list = formData[key];
    if (list.includes(item)) {
      setFormData({ ...formData, [key]: list.filter((i) => i !== item) });
    } else {
      setFormData({ ...formData, [key]: [...list, item] });
    }
  };

  const handleSaveProfile = async () => {
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
        title: "Profile saved",
        description: "Your profile is set up and ready.",
      });
      navigate("/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save profile";
      toast({
        title: "Error saving profile",
        description: message,
        variant: "destructive",
      });
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.fullName.trim() !== "" && formData.college.trim() !== "";
    if (step === 2) return formData.skills.length > 0;
    if (step === 3) return formData.availability.length > 0;
    return true;
  };

  const isPaidSelected = formData.availability.includes("paid");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      
      {/* Calm, Clean Top Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <span className="font-semibold text-sm tracking-tight">Collab.io</span>
            <span className="text-muted-foreground text-xs ml-2">Profile Setup</span>
          </div>
          <button
            onClick={() => navigate("/home")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now &rarr;
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Rail: Quiet, Pragmatic Step Navigation */}
        <aside className="lg:col-span-4 space-y-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Setup your profile</h1>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Fill out your basic info and skills so teammates and project leaders across your campus know what you build.
            </p>
          </div>

          <nav className="space-y-1 pt-4 border-t border-border/80">
            {[
              { id: 1, label: "General details", desc: "Name, college & bio" },
              { id: 2, label: "Skills & proficiency", desc: "Technologies you use" },
              { id: 3, label: "Preferences & rates", desc: "Projects and availability" },
            ].map((item) => {
              const isActive = step === item.id;
              const isDone = step > item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (isDone || isActive) setStep(item.id);
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-lg flex items-start justify-between transition-colors ${
                    isActive
                      ? "bg-muted font-medium text-foreground"
                      : isDone
                      ? "text-foreground hover:bg-muted/50 cursor-pointer"
                      : "text-muted-foreground opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div>
                    <div className="text-sm flex items-center gap-2">
                      <span>{item.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  {isDone && <Check className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Area: Clean, Natural Form Without Icon Overload */}
        <div className="lg:col-span-8 bg-card sm:border sm:border-border sm:rounded-2xl sm:p-8 sm:shadow-xs space-y-8">
          
          {/* STEP 1: GENERAL DETAILS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-base font-semibold">General details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your name and college will be visible on your public card.</p>
              </div>

              {/* Avatar Upload Box */}
              <div className="flex items-center gap-5">
                {user?.id && (
                  <AvatarUpload
                    userId={user.id}
                    currentAvatarUrl={formData.avatar || existingProfile?.avatar_url}
                    initials={formData.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                    onUploadComplete={(url) => setFormData({ ...formData, avatar: url })}
                    size="lg"
                  />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium">Profile photo</p>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    We recommend a clear photo of your face or a familiar avatar. JPG or PNG under 5MB.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Full name *</label>
                    <Input
                      placeholder="e.g. Rahul Varma"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="h-10 text-sm bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">College or university *</label>
                    <Input
                      placeholder="e.g. IIT Bombay or BITS Pilani"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      className="h-10 text-sm bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Degree / Major</label>
                    <Input
                      placeholder="e.g. B.Tech Computer Science"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      className="h-10 text-sm bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Graduation year / Class</label>
                    <Input
                      placeholder="e.g. 3rd Year or 2027"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="h-10 text-sm bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">GitHub profile URL</label>
                  <Input
                    placeholder="https://github.com/username"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className="h-10 text-sm bg-background font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Helps teammates review your code repositories and activity.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-medium text-foreground">Short bio</label>
                    <span className="text-[11px] text-muted-foreground">{formData.bio.length}/250</span>
                  </div>
                  <Textarea
                    placeholder="Briefly share what you like building, technologies you enjoy working with, or hackathons you are targeting..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    maxLength={250}
                    className="min-h-[88px] text-sm bg-background resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SKILLS & PROFICIENCY */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-base font-semibold">Skills & proficiency</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select technologies you know. You can specify proficiency for each below.</p>
              </div>

              {/* Quick Add Skills */}
              <div className="space-y-2.5">
                <label className="text-xs font-medium text-muted-foreground">Common skills</label>
                <div className="flex flex-wrap gap-1.5">
                  {allSkills.map((skill) => {
                    const isSelected = formData.skills.some((s) => s.name === skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          if (isSelected) handleRemoveSkill(skill);
                          else handleAddSkill(skill);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs transition-colors border ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-background text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Skill Input */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium">Add a skill not listed above</label>
                <div className="flex gap-2 max-w-sm">
                  <Input
                    placeholder="e.g. Rust, Solidity, Docker..."
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    className="h-9 text-sm bg-background"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill(customSkillInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9 px-3 text-xs"
                    onClick={() => handleAddSkill(customSkillInput)}
                    disabled={!customSkillInput.trim()}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Selected Skills List */}
              {formData.skills.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <label className="text-xs font-medium text-foreground">Your selected skills ({formData.skills.length})</label>
                  <div className="divide-y divide-border/60 rounded-xl border border-border bg-background">
                    {formData.skills.map((skill) => (
                      <div key={skill.name} className="flex items-center justify-between px-4 py-3 gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">{skill.name}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => handleLevelChange(skill.name, level)}
                              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                                skill.level === level
                                  ? "bg-primary text-primary-foreground font-medium"
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.name)}
                            className="ml-2 p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                            title="Remove skill"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PREFERENCES & RATES */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-base font-semibold">Preferences & rates</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Let others know what kind of collaborations you are open to.</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-foreground">What are you available for? *</label>
                <div className="grid gap-2.5">
                  {[
                    { id: "learning", label: "Peer learning & study groups", desc: "Skill exchanges, pair programming, and coursework discussions" },
                    { id: "project", label: "Campus & hackathon projects", desc: "Building MVPs, weekend sprints, or university competitions" },
                    { id: "paid", label: "Paid freelance & gigs", desc: "Accepting compensated project requests from peers or founders" },
                  ].map((opt) => {
                    const isChecked = formData.availability.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        onClick={() => toggleOption("availability", opt.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
                          isChecked ? "border-primary bg-primary/[0.03]" : "border-border bg-background hover:bg-muted/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-border text-primary focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-semibold text-foreground block">{opt.label}</span>
                          <span className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 block">{opt.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-medium text-foreground">Interests (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "startups", label: "Startups & Ventures" },
                    { id: "hackathons", label: "Hackathons" },
                    { id: "college", label: "Academic Research" },
                  ].map((intOpt) => {
                    const isSelected = formData.interests.includes(intOpt.id);
                    return (
                      <button
                        key={intOpt.id}
                        type="button"
                        onClick={() => toggleOption("interests", intOpt.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:text-foreground"
                        }`}
                      >
                        {intOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Freelance salary slider if paid is selected */}
              {isPaidSelected && (
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Expected project rate range</span>
                    <span className="font-semibold text-emerald-600">
                      ₹{formData.earningRange[0]} – ₹{formData.earningRange[1]}
                    </span>
                  </div>
                  <Slider
                    value={formData.earningRange}
                    onValueChange={(val) => setFormData({ ...formData, earningRange: val as [number, number] })}
                    min={500}
                    max={5000}
                    step={250}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>₹500 (Small fix)</span>
                    <span>₹5,000+ (Full build)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="pt-6 border-t border-border flex items-center justify-between">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(step - 1)}
                  className="h-9 px-4 text-xs"
                >
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < 3 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="h-9 px-5 text-xs bg-primary text-primary-foreground hover:opacity-90"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={!canProceed() || updateProfile.isPending}
                  className="h-9 px-6 text-xs bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save and finish</span>
                  )}
                </Button>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

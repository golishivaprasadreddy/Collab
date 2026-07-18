import { motion } from "framer-motion";
import { Star, Eye, IndianRupee, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillBadge } from "./skill-badge";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";

interface ProfileCardProps {
  id: string;
  name: string;
  avatar?: string;
  college?: string;
  skills: Array<{ name: string; level?: "Beginner" | "Intermediate" | "Advanced" }>;
  points: number;
  trustScore?: number;
  completedCollabs?: number;
  isPaidAvailable?: boolean;
  onViewPortfolio?: (id: string) => void;
  className?: string;
}

export function ProfileCard({
  id,
  name,
  avatar,
  college,
  skills,
  points,
  trustScore,
  completedCollabs,
  isPaidAvailable,
  onViewPortfolio,
  className,
}: ProfileCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px hsl(258 100% 72% / 0.15)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative group bg-card rounded-2xl p-5 border border-border/60 flex flex-col gap-4 overflow-hidden transition-all duration-300",
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <Avatar className="h-13 w-13 ring-2 ring-border group-hover:ring-primary/30 transition-all duration-300" style={{ height: 52, width: 52 }}>
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {isPaidAvailable && (
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success flex items-center justify-center border-2 border-card">
              <IndianRupee className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-sm leading-snug">{name}</h3>
          {college && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground truncate">{college}</p>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-warning fill-warning" />
              <span className="text-xs font-semibold text-foreground">
                {trustScore != null ? Number(trustScore).toFixed(1) : points}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {trustScore != null ? "trust" : "pts"}
              </span>
            </div>
            {completedCollabs != null && completedCollabs > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {completedCollabs} collab{completedCollabs !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {skills.slice(0, 3).map((skill) => (
          <SkillBadge key={skill.name} size="sm" level={skill.level}>
            {skill.name}
          </SkillBadge>
        ))}
        {skills.length > 3 && (
          <SkillBadge size="sm" variant="muted">
            +{skills.length - 3}
          </SkillBadge>
        )}
      </div>

      {/* CTA */}
      <Button
        onClick={() => onViewPortfolio?.(id)}
        className="w-full mt-auto h-9 text-xs font-medium gradient-primary border-0 opacity-90 group-hover:opacity-100 transition-opacity"
        style={{ boxShadow: "0 4px 14px hsl(258 100% 72% / 0.20)" }}
      >
        <Eye className="h-3.5 w-3.5 mr-1.5" />
        View Portfolio
      </Button>
    </motion.div>
  );
}
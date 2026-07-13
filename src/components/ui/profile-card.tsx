import { motion } from "framer-motion";
import { Star, Eye, IndianRupee } from "lucide-react";
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-card rounded-2xl p-5 shadow-card border border-border/50 flex flex-col gap-4",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 ring-2 ring-primary/10">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          {college && (
            <p className="text-sm text-muted-foreground truncate">{college}</p>
          )}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-warning fill-warning" />
              <span className="text-sm font-medium text-foreground">
                {trustScore != null ? Number(trustScore).toFixed(1) : points}
              </span>
              <span className="text-xs text-muted-foreground">
                {trustScore != null ? "trust" : "pts"}
              </span>
            </div>
            {completedCollabs != null && completedCollabs > 0 && (
              <span className="text-xs text-muted-foreground">
                • {completedCollabs} collab{completedCollabs !== 1 ? "s" : ""}
              </span>
            )}
            {isPaidAvailable && (
              <span className="flex items-center gap-0.5 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                <IndianRupee className="h-3 w-3" />
                Paid
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
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

      <Button
        onClick={() => onViewPortfolio?.(id)}
        variant="outline"
        className="w-full mt-auto"
      >
        <Eye className="h-4 w-4 mr-2" />
        View Portfolio
      </Button>
    </motion.div>
  );
}
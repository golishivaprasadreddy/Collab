import { motion } from "framer-motion";
import { Award, Loader2 } from "lucide-react";
import { useSkillBadges } from "@/hooks/useSkillBadges";

interface SkillBadgesDisplayProps {
  userId: string;
}

const badgeColors = {
  bronze: "from-amber-600 to-amber-800 text-amber-100",
  silver: "from-slate-400 to-slate-600 text-slate-100",
  gold: "from-yellow-400 to-yellow-600 text-yellow-100",
  platinum: "from-cyan-300 to-cyan-500 text-cyan-900",
};

const badgeIcons = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
};

export function SkillBadgesDisplay({ userId }: SkillBadgesDisplayProps) {
  const { data: badges = [], isLoading } = useSkillBadges(userId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-5 w-5 text-warning" />
        <h3 className="font-semibold text-foreground">Verified Badges</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r ${
              badgeColors[badge.displayLevel]
            } shadow-md`}
          >
            <span className="text-lg">{badgeIcons[badge.displayLevel]}</span>
            <span className="text-sm font-medium">{badge.skill_name}</span>
            <span className="text-xs opacity-75">
              ({badge.collaborations_completed})
            </span>
          </motion.div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Badges are earned by completing collaborations in specific skills
      </p>
    </div>
  );
}

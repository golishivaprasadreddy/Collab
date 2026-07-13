import { motion } from "framer-motion";
import { Users, IndianRupee, Star, TrendingUp, Loader2, FolderKanban } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  iconBg: string;
  delay: number;
}

function StatCard({ icon, label, value, subValue, iconBg, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-xl p-4 border border-border shadow-card"
    >
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        {subValue && (
          <span className="text-xs text-success font-medium bg-success/10 px-2 py-1 rounded-full">
            {subValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground mt-3">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

export function DashboardStats() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border animate-pulse">
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div className="h-6 w-16 bg-muted rounded mt-3" />
            <div className="h-4 w-24 bg-muted rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        icon={<Users className="h-5 w-5 text-primary" />}
        iconBg="bg-primary/10"
        label="Total Collabs"
        value={stats.totalCollaborations}
        subValue={stats.ongoingCollaborations > 0 ? `${stats.ongoingCollaborations} active` : undefined}
        delay={0.1}
      />
      <StatCard
        icon={<IndianRupee className="h-5 w-5 text-success" />}
        iconBg="bg-success/10"
        label="Total Earnings"
        value={`₹${stats.totalEarnings.toLocaleString()}`}
        delay={0.15}
      />
      <StatCard
        icon={<FolderKanban className="h-5 w-5 text-primary" />}
        iconBg="bg-primary/10"
        label="Projects"
        value={stats.totalProjects}
        subValue={stats.totalProjects > 0 ? "showcase" : undefined}
        delay={0.2}
      />
      <StatCard
        icon={<Star className="h-5 w-5 text-warning" />}
        iconBg="bg-warning/10"
        label="Reputation"
        value={stats.reputationScore}
        subValue="points"
        delay={0.25}
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5 text-accent" />}
        iconBg="bg-accent/10"
        label="Trust Score"
        value={stats.trustScore.toFixed(1)}
        subValue={stats.completedCollaborations > 0 ? `${stats.completedCollaborations} done` : undefined}
        delay={0.3}
      />
    </div>
  );
}

import { motion } from "framer-motion";
import { 
  Send, 
  CheckCircle2, 
  MessageCircle, 
  Star, 
  Clock,
  Loader2
} from "lucide-react";
import { useActivityFeed } from "@/hooks/useDashboardStats";
import { formatDistanceToNow } from "date-fns";

const activityIcons: Record<string, React.ReactNode> = {
  collaboration_sent: <Send className="h-4 w-4 text-primary" />,
  collaboration_received: <MessageCircle className="h-4 w-4 text-accent" />,
  collaboration_accepted: <CheckCircle2 className="h-4 w-4 text-success" />,
  collaboration_started: <CheckCircle2 className="h-4 w-4 text-success" />,
  collaboration_completed: <Star className="h-4 w-4 text-warning" />,
  collaboration_updated: <Clock className="h-4 w-4 text-muted-foreground" />,
};

const activityBgColors: Record<string, string> = {
  collaboration_sent: "bg-primary/10",
  collaboration_received: "bg-accent/10",
  collaboration_accepted: "bg-success/10",
  collaboration_started: "bg-success/10",
  collaboration_completed: "bg-warning/10",
  collaboration_updated: "bg-muted",
};

export function ActivityFeed() {
  const { data: activities = [], isLoading } = useActivityFeed(10);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No activity yet</p>
          <p className="text-muted-foreground text-xs mt-1">
            Start collaborating to see your activity here
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl border border-border p-4"
    >
      <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
      
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="flex items-start gap-3"
          >
            <div className={`h-8 w-8 rounded-full ${activityBgColors[activity.type] || "bg-muted"} flex items-center justify-center flex-shrink-0`}>
              {activityIcons[activity.type] || <Clock className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

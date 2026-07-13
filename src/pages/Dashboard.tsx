import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MiniDashboard } from "@/components/MiniDashboard";
import { Settings, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/NotificationBell";
import { useActiveCollaborations } from "@/hooks/useCollaborations";
import { useEvents } from "@/hooks/useEvents";
import { Badge } from "@/components/ui/badge";

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      type: "spring" as const,
      stiffness: 260,
      damping: 22,
    },
  }),
};

const quickActions = [
  { icon: "🔍", title: "Find Collaborators", subtitle: "Search by skills", path: "/search" },
  { icon: "🏆", title: "Events", subtitle: "Hackathons & more", path: "/events" },
  { icon: "📥", title: "View Requests", subtitle: "Manage collaborations", path: "/requests" },
  { icon: "🏅", title: "Leaderboard", subtitle: "See top performers", path: "/leaderboard" },
];

function DeadlineAlerts() {
  const navigate = useNavigate();
  const { data: collabs = [] } = useActiveCollaborations();
  const { data: events = [] } = useEvents();

  const now = new Date();

  const urgentEvents = events
    .filter((e: { registration_deadline?: string | null; id: string; title: string }) => {
      const deadline = e.registration_deadline ? new Date(e.registration_deadline) : null;
      if (!deadline || deadline < now) return false;
      const days = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return days <= 7;
    })
    .map((e: { id: string; title: string; registration_deadline?: string | null }) => ({
      id: e.id,
      type: "event" as const,
      title: e.title,
      deadline: new Date(e.registration_deadline!),
      daysLeft: Math.ceil((new Date(e.registration_deadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

  const pendingTasks = collabs
    .filter((c: { status?: string }) => c.status === "ongoing" || c.status === "accepted")
    .map((c: { id: string; purpose?: string | null; skill_needed?: string | null; status?: string }) => ({
      id: c.id,
      type: "task" as const,
      title: c.purpose || c.skill_needed,
      status: c.status,
    }));

  if (urgentEvents.length === 0 && pendingTasks.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 22 }}
      className="space-y-2"
    >
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5, delay: 0.5 }}>
          <AlertCircle className="h-4 w-4 text-warning" />
        </motion.div>
        Alerts & Reminders
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {urgentEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
              whileHover={{ scale: 1.01, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/events")}
              className="flex items-center gap-3 p-3 bg-warning/5 border border-warning/20 rounded-xl cursor-pointer hover:bg-warning/10 transition-colors"
            >
              <Clock className="h-4 w-4 text-warning flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">Registration deadline</p>
              </div>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 + i * 0.06 }}>
                <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                  {event.daysLeft}d left
                </Badge>
              </motion.div>
            </motion.div>
          ))}
          {pendingTasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (urgentEvents.length + i) * 0.06, type: "spring", stiffness: 300, damping: 25 }}
              whileHover={{ scale: 1.01, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/collaboration/${task.id}`)}
              className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors"
            >
              <AlertCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground">Active collaboration</p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {task.status}
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const userName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="gradient-hero px-6 pt-12 pb-8 rounded-b-3xl"
      >
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
            className="flex items-center gap-4"
          >
            <MiniDashboard userId={user?.id}>
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <Avatar
                  className="h-14 w-14 ring-2 ring-primary-foreground/20 cursor-pointer"
                  onClick={() => navigate("/portfolio")}
                >
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </MiniDashboard>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring" }}
                className="text-xl font-bold text-primary-foreground"
              >
                Hi, {userName} 👋
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-primary-foreground/80 text-sm"
              >
                Welcome back to your dashboard
              </motion.p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <NotificationBell />
            <motion.button
              whileHover={{ scale: 1.1, rotate: 45 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/settings")}
              className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground"
            >
              <Settings className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      <div className="px-4 pt-6 space-y-6">
        {/* Quick Actions (Events, Leaderboard, etc.) — moved above stats */}
        <motion.section className="grid grid-cols-2 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.path}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ y: -4, boxShadow: "0 8px 25px -8px hsl(var(--primary) / 0.15)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(action.path)}
              className="bg-card rounded-xl p-4 border border-border text-left hover:border-primary/50 transition-colors"
            >
              <motion.span
                className="text-2xl block"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 400, damping: 15 }}
              >
                {action.icon}
              </motion.span>
              <p className="font-medium text-foreground mt-2">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.subtitle}</p>
            </motion.button>
          ))}
        </motion.section>

        {/* Stats Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 22 }}
        >
          <DashboardStats />
        </motion.section>

        {/* Deadline & Progress Alerts */}
        <DeadlineAlerts />

        {/* Activity Feed */}
        <ActivityFeed />
      </div>
    </div>
  );
}

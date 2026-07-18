import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MiniDashboard } from "@/components/MiniDashboard";
import { Settings, Clock, AlertCircle, Compass, Users, GitPullRequest, Trophy, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/NotificationBell";
import { useActiveCollaborations } from "@/hooks/useCollaborations";
import { useEvents } from "@/hooks/useEvents";
import { Badge } from "@/components/ui/badge";

const quickActions = [
  { icon: Users, label: "Explore Directory", desc: "Browse peers", path: "/search", color: "text-blue-500 bg-blue-500/10" },
  { icon: Compass, label: "Campus Events", desc: "Hackathons & meets", path: "/events", color: "text-purple-500 bg-purple-500/10" },
  { icon: GitPullRequest, label: "Project Requests", desc: "Open collaboration invites", path: "/requests", color: "text-emerald-500 bg-emerald-500/10" },
  { icon: Trophy, label: "Leaderboard", desc: "Top trust scores", path: "/leaderboard", color: "text-amber-500 bg-amber-500/10" },
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
    <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>Active Alerts</span>
        </h3>
        <span className="text-xs text-muted-foreground">{urgentEvents.length + pendingTasks.length} items</span>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {urgentEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate("/events")}
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background hover:border-amber-500/40 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{event.title}</p>
                  <p className="text-[11px] text-muted-foreground">Registration closing soon</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-medium text-amber-600 border-amber-500/30 bg-amber-500/5">
                {event.daysLeft}d left
              </Badge>
            </div>
          ))}

          {pendingTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => navigate(`/collaboration/${task.id}`)}
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background hover:border-primary/40 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <AlertCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{task.title}</p>
                  <p className="text-[11px] text-muted-foreground">Active collaboration</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-medium">
                {task.status}
              </Badge>
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const userName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Student";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12 text-foreground">
      {/* Clean Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <MiniDashboard userId={user?.id}>
              <Avatar
                className="h-10 w-10 ring-1 ring-border hover:ring-primary/40 transition-all cursor-pointer flex-shrink-0"
                onClick={() => navigate("/portfolio")}
              >
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
                <AvatarFallback className="bg-muted text-foreground font-medium text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </MiniDashboard>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-foreground truncate">
                  {userName}'s Workspace
                </h1>
                <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground border border-border">
                  Verified
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.college || "Campus Network"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <NotificationBell />
            <button
              onClick={() => navigate("/settings")}
              className="h-9 w-9 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <div
              key={action.path}
              onClick={() => navigate(action.path)}
              className="bg-card rounded-xl p-3.5 border border-border shadow-xs hover:border-border/80 transition-all cursor-pointer group flex items-start gap-3"
            >
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                <action.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-snug truncate">
                  {action.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {action.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Alerts section */}
        <DeadlineAlerts />

        {/* Two-Column Grid */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* Stats overview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="font-semibold text-sm">Your activity & points</h3>
                <button
                  onClick={() => navigate("/portfolio")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View profile &rarr;
                </button>
              </div>
              <DashboardStats />
            </div>

            {/* Simple Create Request Box */}
            <div className="bg-card rounded-2xl border border-border p-5 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-semibold text-sm">Need teammates?</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Post a collaboration request and invite peers across campus with specific skills.
                </p>
              </div>
              <button
                onClick={() => navigate("/requests")}
                className="flex items-center justify-between w-full p-3 rounded-xl bg-muted/60 hover:bg-muted border border-border/80 text-xs font-semibold transition-all"
              >
                <span>Post a request</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Activity Feed Column */}
          <div className="lg:col-span-7">
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="font-semibold text-sm">Recent campus updates</h3>
                <span className="text-xs text-muted-foreground">Live activity</span>
              </div>
              <ActivityFeed />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

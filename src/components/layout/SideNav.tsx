import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Compass,
  MessageCircle,
  User,
  GitPullRequest,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollaborationRequests } from "@/hooks/useCollaborations";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/home", icon: Compass, label: "Discover" },
  { to: "/requests", icon: GitPullRequest, label: "Requests" },
  { to: "/messages", icon: MessageCircle, label: "Messages" },
  { to: "/events", icon: CalendarDays, label: "Events" },
  { to: "/portfolio", icon: User, label: "Profile" },
];

export function SideNav() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: requestsData } = useCollaborationRequests();
  const pendingCount = requestsData?.incoming?.filter((r) => r.status === "pending").length || 0;

  const [collapsed, setCollapsed] = useState(false);

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r border-border/60 bg-sidebar overflow-hidden"
      style={{
        background: "hsl(var(--sidebar-background))",
        boxShadow: "1px 0 30px hsl(258 100% 72% / 0.04)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border/40 flex-shrink-0">
        <motion.div
          className="flex items-center gap-3 overflow-hidden"
          animate={{ opacity: 1 }}
        >
          <div className="h-9 w-9 flex-shrink-0 rounded-xl gradient-primary flex items-center justify-center glow-primary shadow-lg">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.2 }}
            className="font-bold text-lg text-foreground whitespace-nowrap overflow-hidden"
          >
            Collab.io
          </motion.span>
        </motion.div>

        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "ml-auto flex-shrink-0 h-7 w-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
            collapsed && "ml-auto"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </motion.button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ to, icon: Icon, label }) => (
          <RouterNavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="sidenav-active"
                    className="absolute inset-0 rounded-xl gradient-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ boxShadow: "var(--glow-primary)" }}
                  />
                )}

                <div className="relative flex-shrink-0">
                  <Icon className={cn("h-5 w-5 flex-shrink-0 relative z-10")} />
                  {to === "/requests" && pendingCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold z-20">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </div>

                <motion.span
                  animate={{
                    opacity: collapsed ? 0 : 1,
                    width: collapsed ? 0 : "auto",
                  }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10 whitespace-nowrap overflow-hidden"
                >
                  {label}
                </motion.span>

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {label}
                    {to === "/requests" && pendingCount > 0 && (
                      <span className="ml-1.5 text-destructive">({pendingCount})</span>
                    )}
                  </div>
                )}
              </>
            )}
          </RouterNavLink>
        ))}
      </nav>

      {/* Bottom — User + Settings */}
      <div className="px-3 py-4 border-t border-border/40 space-y-1 flex-shrink-0">
        <button
          onClick={() => navigate("/settings")}
          className={cn(
            "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200",
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.2 }}
            className="whitespace-nowrap overflow-hidden"
          >
            Settings
          </motion.span>
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Settings
            </div>
          )}
        </button>

        {/* User profile */}
        <div
          onClick={() => navigate("/portfolio")}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-muted/60 transition-colors"
        >
          <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <motion.div
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-w-0 overflow-hidden"
          >
            <p className="text-sm font-medium text-foreground truncate whitespace-nowrap">
              {profile?.full_name || user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate whitespace-nowrap">
              {profile?.college || "Collab.io"}
            </p>
          </motion.div>

          <motion.button
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
              signOut();
            }}
            className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors overflow-hidden"
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}

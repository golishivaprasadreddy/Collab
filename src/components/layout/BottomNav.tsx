import { NavLink as RouterNavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Compass, MessageCircle, User, GitPullRequest } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollaborationRequests } from "@/hooks/useCollaborations";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/home", icon: Compass, label: "Discover" },
  { to: "/requests", icon: GitPullRequest, label: "Requests" },
  { to: "/messages", icon: MessageCircle, label: "Messages" },
  { to: "/portfolio", icon: User, label: "Profile" },
];

export function BottomNav() {
  const { data: requestsData } = useCollaborationRequests();
  const pendingCount = requestsData?.incoming?.filter((r) => r.status === "pending").length || 0;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50"
      style={{
        background: "hsl(var(--card) / 0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1 pb-safe">
        {navItems.map(({ to, icon: Icon, label }) => (
          <RouterNavLink
            key={to}
            to={to}
            className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[56px]"
          >
            {({ isActive }) => (
              <>
                {/* Active pill background */}
                {isActive && (
                  <motion.div
                    layoutId="bottomnav-active"
                    className="absolute inset-0 mx-1 rounded-2xl gradient-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    style={{ boxShadow: "var(--glow-primary)" }}
                  />
                )}

                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 relative z-10 transition-colors duration-200",
                      isActive ? "text-white" : "text-muted-foreground"
                    )}
                  />
                  {to === "/requests" && pendingCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold z-20"
                    >
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </motion.span>
                  )}
                </div>

                <span
                  className={cn(
                    "text-[10px] font-medium relative z-10 transition-colors duration-200",
                    isActive ? "text-white" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
}

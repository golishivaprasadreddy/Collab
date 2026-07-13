import { NavLink as RouterNavLink } from "react-router-dom";
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
  const pendingCount = requestsData?.incoming?.filter(r => r.status === "pending").length || 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 pb-safe">
        {navItems.map(({ to, icon: Icon, label }) => (
          <RouterNavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-colors text-muted-foreground relative",
                isActive && "text-primary"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "p-1.5 rounded-xl transition-all duration-200 relative",
                    isActive && "bg-gradient-to-r from-primary/15 via-accent/15 to-secondary/15"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  {to === "/requests" && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px] font-medium", isActive && "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent")}>{label}</span>
              </>
            )}
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
}

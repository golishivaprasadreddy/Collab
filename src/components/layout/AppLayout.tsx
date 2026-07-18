import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background mesh-bg">
      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <SideNav />
      </div>

      {/* Main content area — offset for sidebar on desktop */}
      <main className="pb-20 lg:pb-0 lg:pl-[240px] transition-all duration-300 min-h-screen">
        <Outlet />
      </main>

      {/* Bottom nav — mobile only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

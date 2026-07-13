import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Target, Award, IndianRupee } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface MiniDashboardProps {
  children: React.ReactNode;
  userId?: string;
}

export function MiniDashboard({ children, userId }: MiniDashboardProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: profile } = useProfile(userId);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({ x: rect.left + rect.width / 2, y: rect.top });
    }
    timerRef.current = setTimeout(() => setShow(true), 800);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="touch-none select-none"
      >
        {children}
      </div>

      <AnimatePresence>
        {show && profile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90]"
            onClick={() => setShow(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute bg-card rounded-2xl border border-border shadow-xl p-4 w-56"
              style={{
                left: Math.min(Math.max(position.x - 112, 8), window.innerWidth - 232),
                top: Math.max(position.y - 160, 8),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-semibold text-foreground text-sm truncate mb-3">
                {profile.full_name || "Anonymous"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 text-warning fill-warning" />
                    <span className="text-sm font-bold text-foreground">
                      {profile.reputation?.points || 0}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Points</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Award className="h-3 w-3 text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      {Number(profile.reputation?.trust_score || 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Trust</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="h-3 w-3 text-accent" />
                    <span className="text-sm font-bold text-foreground">
                      {profile.reputation?.total_collaborations || 0}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Collabs</span>
                </div>
                <div className="bg-success/10 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <IndianRupee className="h-3 w-3 text-success" />
                    <span className="text-sm font-bold text-success">
                      {((profile.reputation?.total_earnings || 0) / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Earned</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {profile.skills.slice(0, 3).map((s) => (
                  <span key={s.id} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {s.skill_name}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

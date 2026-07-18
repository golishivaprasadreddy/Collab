import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logoIcon from "@/assets/logo-icon.png";

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 2,
}));

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(async () => {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, college")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.full_name || !profile?.college) {
          navigate("/setup");
        } else {
          navigate("/home");
        }
      } else {
        navigate("/onboarding");
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [navigate, user, loading]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 100% 80% at 50% -10%, hsl(258 100% 72% / 0.35), transparent 60%), radial-gradient(ellipse 80% 60% at 100% 50%, hsl(190 90% 55% / 0.20), transparent 50%), hsl(var(--background))"
      }}
    >
      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/30 pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* Logo & text */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center z-10"
      >
        {/* Logo container with glow ring */}
        <motion.div
          className="relative mb-8"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-3xl gradient-primary opacity-30 blur-2xl scale-125" />
          <div className="relative h-28 w-28 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl"
            style={{ boxShadow: "var(--glow-primary)" }}
          >
            <img src={logoIcon} alt="Collab.io logo" className="h-20 w-20 object-contain" />
          </div>

          {/* Orbiting ring */}
          <motion.div
            className="absolute -inset-4 rounded-full border border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute -inset-8 rounded-full border border-accent/10"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-5xl font-bold gradient-text mb-3"
        >
          Collab.io
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-muted-foreground text-lg"
        >
          Turn skills into real projects
        </motion.p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-16 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}

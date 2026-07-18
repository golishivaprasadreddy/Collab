import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, Handshake, Trophy, ChevronRight, ArrowRight } from "lucide-react";

const slides = [
  {
    icon: Search,
    gradient: "from-violet-500 to-purple-600",
    glow: "hsl(258 100% 72% / 0.3)",
    headline: "Discover students by skills",
    subtext: "Find peers who match what you need for your projects and ideas.",
    emoji: "🔍",
  },
  {
    icon: Handshake,
    gradient: "from-cyan-400 to-blue-500",
    glow: "hsl(190 90% 55% / 0.3)",
    headline: "Collaborate, don't compete",
    subtext: "Send collaboration requests with purpose and clarity. Build together.",
    emoji: "🤝",
  },
  {
    icon: Trophy,
    gradient: "from-amber-400 to-orange-500",
    glow: "hsl(38 95% 52% / 0.3)",
    headline: "Build experience before graduation",
    subtext: "Learn, earn, and build trust through real work that matters.",
    emoji: "🏆",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slide = slides[currentSlide];
  const Icon = slide.icon;
  const isLast = currentSlide === slides.length - 1;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(258 100% 72% / 0.12), transparent 60%), hsl(var(--background))",
      }}
    >
      {/* Skip button */}
      <div className="flex justify-end px-6 pt-6">
        <button
          onClick={() => navigate("/login")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 60, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            {/* Animated icon */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-10"
            >
              <div
                className={`h-32 w-32 rounded-[2.5rem] bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-2xl`}
                style={{ boxShadow: `0 20px 60px ${slide.glow}` }}
              >
                <Icon className="h-16 w-16 text-white" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-6xl mb-5"
            >
              {slide.emoji}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-foreground mb-4 leading-tight"
            >
              {slide.headline}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-lg leading-relaxed"
            >
              {slide.subtext}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="flex gap-2 mt-12">
          {slides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentSlide(index)}
              animate={{
                width: index === currentSlide ? 32 : 8,
                backgroundColor: index === currentSlide
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted-foreground) / 0.3)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="h-2 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* CTA buttons */}
      <div className="p-6 space-y-3">
        {!isLast ? (
          <Button
            onClick={() => setCurrentSlide(currentSlide + 1)}
            className="w-full h-14 text-base gradient-primary border-0 shadow-lg"
            style={{ boxShadow: "var(--glow-primary)" }}
            size="lg"
          >
            Next
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={() => navigate("/signup")}
            className="w-full h-14 text-base gradient-primary border-0 shadow-lg"
            style={{ boxShadow: "var(--glow-primary)" }}
            size="lg"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}

        <Button
          onClick={() => navigate("/login")}
          variant="ghost"
          className="w-full h-12 text-muted-foreground hover:text-foreground"
        >
          Already have an account?{" "}
          <span className="text-primary font-semibold ml-1">Sign in</span>
        </Button>
      </div>
    </div>
  );
}

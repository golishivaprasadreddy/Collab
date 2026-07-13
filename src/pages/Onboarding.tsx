import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, Handshake, Trophy, ChevronRight } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";

const slides = [
  {
    icon: Search,
    headline: "Discover students by skills",
    subtext: "Find peers who match what you need for your projects",
  },
  {
    icon: Handshake,
    headline: "Collaborate, don't compete",
    subtext: "Send collaboration requests with purpose and clarity",
  },
  {
    icon: Trophy,
    headline: "Build experience before graduation",
    subtext: "Learn, earn, and build trust through real work",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <img src={logoIcon} alt="Collab.io" className="h-28 w-28 object-contain" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="h-28 w-28 rounded-3xl gradient-primary flex items-center justify-center mb-10 shadow-lg">
              {(() => {
                const Icon = slides[currentSlide].icon;
                return <Icon className="h-14 w-14 text-primary-foreground" />;
              })()}
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-3">
              {slides[currentSlide].headline}
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {slides[currentSlide].subtext}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dots indicator */}
        <div className="flex gap-2 mt-12">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="p-6 space-y-3">
        {currentSlide < slides.length - 1 ? (
          <Button onClick={nextSlide} className="w-full h-14 text-base" size="lg">
            Next
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={() => navigate("/signup")}
            className="w-full h-14 text-base gradient-primary border-0"
            size="lg"
          >
            Get Started
          </Button>
        )}

        <Button
          onClick={() => navigate("/login")}
          variant="ghost"
          className="w-full h-12 text-muted-foreground"
        >
          Already have an account? <span className="text-primary ml-1">Login</span>
        </Button>
      </div>
    </div>
  );
}

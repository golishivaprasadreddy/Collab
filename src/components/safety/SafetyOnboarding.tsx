import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, MessageSquare, CreditCard, AlertTriangle, FileText, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAcknowledgeSafety } from "@/hooks/useSafetyAcknowledgment";
import { SAFETY_TIPS } from "@/utils/contentModeration";

interface SafetyOnboardingProps {
  onComplete: () => void;
}

const SAFETY_SLIDES = [
  {
    icon: Shield,
    title: "Your Safety Matters",
    description: "Collabio is designed to protect both collaborators. All communications and payments are secure when you stay on-platform.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: MessageSquare,
    title: "Keep Chats On-Platform",
    description: "Never share phone numbers, emails, or social media handles. Our chat keeps your personal information private.",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: CreditCard,
    title: "Protected Payments",
    description: "All paid collaborations are processed through our secure payment system. Off-platform payments are not protected.",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Report Suspicious Behavior",
    description: "If someone asks you to go off-platform or behaves inappropriately, report them immediately. We take safety seriously.",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: FileText,
    title: "Document Everything",
    description: "Keep all agreements and discussions in the chat. This protects both parties and helps resolve any disputes.",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
];

export function SafetyOnboarding({ onComplete }: SafetyOnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const acknowledgeSafety = useAcknowledgeSafety();

  const isLastSlide = currentSlide === SAFETY_SLIDES.length - 1;
  const slide = SAFETY_SLIDES[currentSlide];
  const Icon = slide.icon;

  const handleNext = async () => {
    if (isLastSlide) {
      await acknowledgeSafety.mutateAsync();
      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Progress dots */}
      <div className="pt-12 pb-4 px-6">
        <div className="flex justify-center gap-2">
          {SAFETY_SLIDES.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : index < currentSlide
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`h-24 w-24 rounded-full ${slide.bgColor} mx-auto flex items-center justify-center mb-8`}
            >
              <Icon className={`h-12 w-12 ${slide.color}`} />
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground mb-4">
              {slide.title}
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="p-6 space-y-3 safe-area-inset-bottom">
        <Button
          onClick={handleNext}
          className="w-full h-14 text-lg gradient-primary border-0"
          disabled={acknowledgeSafety.isPending}
        >
          {isLastSlide ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              I Understand
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>

        {!isLastSlide && (
          <Button
            variant="ghost"
            onClick={() => setCurrentSlide(SAFETY_SLIDES.length - 1)}
            className="w-full"
          >
            Skip
          </Button>
        )}
      </div>
    </div>
  );
}

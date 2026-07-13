import { ReactNode, useState, useEffect } from "react";
import { useHasAcknowledgedSafety } from "@/hooks/useSafetyAcknowledgment";
import { SafetyOnboarding } from "@/components/safety/SafetyOnboarding";
import { useAuth } from "@/contexts/AuthContext";

interface SafetyCheckWrapperProps {
  children: ReactNode;
}

export function SafetyCheckWrapper({ children }: SafetyCheckWrapperProps) {
  const { user } = useAuth();
  const { hasAcknowledged, isLoading } = useHasAcknowledgedSafety();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    // Show safety onboarding if user is logged in and hasn't acknowledged
    if (user && !isLoading && !hasAcknowledged && !onboardingComplete) {
      setShowOnboarding(true);
    }
  }, [user, isLoading, hasAcknowledged, onboardingComplete]);

  const handleComplete = () => {
    setShowOnboarding(false);
    setOnboardingComplete(true);
  };

  if (showOnboarding && user) {
    return <SafetyOnboarding onComplete={handleComplete} />;
  }

  return <>{children}</>;
}

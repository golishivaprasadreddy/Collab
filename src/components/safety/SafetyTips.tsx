import { motion } from "framer-motion";
import { Shield, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAFETY_TIPS } from "@/utils/contentModeration";

interface SafetyTipsCardProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function SafetyTipsCard({ onDismiss, showDismiss = true }: SafetyTipsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="bg-primary/10 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Safety Tips</span>
        </div>
        {showDismiss && onDismiss && (
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        {SAFETY_TIPS.map((tip, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="h-3 w-3 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{tip.title}</p>
              <p className="text-xs text-muted-foreground">{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface ContextualSafetyTipProps {
  tipType: 'contact_info' | 'payment' | 'external_link' | 'report';
  onDismiss?: () => void;
}

const CONTEXTUAL_TIPS = {
  contact_info: {
    title: "Why can't I share contact info?",
    description: "Keeping communications on-platform protects both parties. All agreements and messages are documented for dispute resolution.",
  },
  payment: {
    title: "About Platform Payments",
    description: "Payments through our platform are protected. If issues arise, we can mediate. Off-platform payments have no protection.",
  },
  external_link: {
    title: "Why are links blocked?",
    description: "External links can lead to phishing or scam sites. If you need to share resources, describe them and let your collaborator search safely.",
  },
  report: {
    title: "How Reporting Works",
    description: "When you report an issue, we freeze the collaboration, review evidence, and resolve within 48 hours. False reports result in penalties.",
  },
};

export function ContextualSafetyTip({ tipType, onDismiss }: ContextualSafetyTipProps) {
  const tip = CONTEXTUAL_TIPS[tipType];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mx-4 mb-3"
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Info className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{tip.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

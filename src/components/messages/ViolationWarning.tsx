import { AlertTriangle, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getPenaltyDescription } from "@/utils/contentModeration";

interface ViolationWarningProps {
  message: string;
  onDismiss?: () => void;
}

export function ViolationWarning({ message, onDismiss }: ViolationWarningProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mx-4 mb-4"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-destructive text-sm">Message Blocked</p>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface PenaltyBannerProps {
  penaltyType: string;
  endsAt?: string | null;
}

export function PenaltyBanner({ penaltyType, endsAt }: PenaltyBannerProps) {
  const description = getPenaltyDescription(penaltyType, endsAt || undefined);
  
  const isWarning = penaltyType === 'warning';
  const bgColor = isWarning ? 'bg-yellow-500/10' : 'bg-destructive/10';
  const borderColor = isWarning ? 'border-yellow-500/30' : 'border-destructive/30';
  const iconColor = isWarning ? 'text-yellow-600' : 'text-destructive';
  const iconBg = isWarning ? 'bg-yellow-500/20' : 'bg-destructive/20';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className={`${bgColor} ${borderColor} border-b px-4 py-3`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Shield className={`h-4 w-4 ${iconColor}`} />
        </div>
        <p className="text-sm text-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

interface ChatRestrictedProps {
  reason: string;
}

export function ChatRestricted({ reason }: ChatRestrictedProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full bg-destructive/10 mx-auto flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Messaging Restricted</h3>
        <p className="text-sm text-muted-foreground">{reason}</p>
      </div>
    </div>
  );
}

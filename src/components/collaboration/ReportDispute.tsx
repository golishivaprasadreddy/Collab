import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, X, Flag, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateDispute } from "@/hooks/useDisputes";
import { useToast } from "@/hooks/use-toast";

interface ReportDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborationId: string;
  reportedUserId: string;
  reportedUserName: string;
}

const DISPUTE_REASONS = [
  { id: "incomplete_work", label: "Work not completed as agreed" },
  { id: "quality_issues", label: "Quality does not meet expectations" },
  { id: "communication", label: "Poor communication or unresponsive" },
  { id: "payment_issues", label: "Payment not received" },
  { id: "scope_creep", label: "Scope changed without agreement" },
  { id: "other", label: "Other issue" },
];

export function ReportDisputeDialog({
  open,
  onOpenChange,
  collaborationId,
  reportedUserId,
  reportedUserName,
}: ReportDisputeDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const createDispute = useCreateDispute();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedReason) return;

    const reasonLabel = DISPUTE_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;
    const fullReason = additionalDetails.trim()
      ? `${reasonLabel}: ${additionalDetails.trim()}`
      : reasonLabel;

    try {
      await createDispute.mutateAsync({
        collaboration_request_id: collaborationId,
        reported_id: reportedUserId,
        reason: fullReason,
      });

      toast({
        title: "Dispute filed",
        description: "We'll review your report within 48 hours.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to file dispute",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Flag className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Report an Issue</DialogTitle>
              <DialogDescription>
                Report a problem with {reportedUserName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-sm text-foreground">
                Filing a dispute will freeze trust updates and prevent new collaborations until resolved.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">What's the issue?</label>
            <div className="space-y-2">
              {DISPUTE_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedReason === reason.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-sm">{reason.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional details (optional)</label>
            <Textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Provide more context about the issue..."
              className="min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {additionalDetails.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || createDispute.isPending}
            className="w-full bg-destructive hover:bg-destructive/90"
          >
            {createDispute.isPending ? "Submitting..." : "Submit Report"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DisputeBannerProps {
  disputeStatus: string;
  isReporter: boolean;
}

export function DisputeBanner({ disputeStatus, isReporter }: DisputeBannerProps) {
  const getMessage = () => {
    if (disputeStatus === "open") {
      return isReporter
        ? "Your dispute is open. Resolution deadline is within 48 hours."
        : "A dispute has been filed against this collaboration. Please respond promptly.";
    }
    if (disputeStatus === "under_review") {
      return "This dispute is under admin review. Updates will be provided shortly.";
    }
    return "There's an active dispute on this collaboration.";
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mx-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
          <Shield className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-destructive text-sm">Active Dispute</p>
          <p className="text-sm text-muted-foreground mt-1">{getMessage()}</p>
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, Shield, Clock, Ban, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserViolations, useActivePenalty } from "@/hooks/useContentModeration";
import { useDisputes } from "@/hooks/useDisputes";
import { useAuth } from "@/contexts/AuthContext";
import { getPenaltyDescription } from "@/utils/contentModeration";

const penaltyIcons = {
  warning: AlertTriangle,
  cooldown: Clock,
  temporary_restriction: Ban,
  account_review: Shield,
  permanent_ban: Ban,
};

const penaltyColors = {
  warning: "text-yellow-600 bg-yellow-500/10",
  cooldown: "text-orange-600 bg-orange-500/10",
  temporary_restriction: "text-destructive bg-destructive/10",
  account_review: "text-destructive bg-destructive/10",
  permanent_ban: "text-destructive bg-destructive/10",
};

const disputeStatusColors = {
  open: "text-yellow-600 bg-yellow-500/10",
  under_review: "text-blue-600 bg-blue-500/10",
  resolved_favor_reporter: "text-green-600 bg-green-500/10",
  resolved_favor_reported: "text-green-600 bg-green-500/10",
  resolved_mutual: "text-green-600 bg-green-500/10",
  dismissed: "text-muted-foreground bg-muted",
};

export default function SafetyCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: violations = [], isLoading: loadingViolations } = useUserViolations();
  const { data: penalty } = useActivePenalty();
  const { data: disputes = [], isLoading: loadingDisputes } = useDisputes();

  const PenaltyIcon = penalty ? penaltyIcons[penalty.penalty_type] : AlertTriangle;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="gradient-hero px-4 pt-4 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">Safety Center</h1>
            <p className="text-primary-foreground/80 text-sm">Violations, disputes & account status</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Current Penalty Status */}
        {penalty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 border ${penaltyColors[penalty.penalty_type]}`}
          >
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${penaltyColors[penalty.penalty_type]}`}>
                <PenaltyIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground capitalize">
                  {penalty.penalty_type.replace('_', ' ')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getPenaltyDescription(penalty.penalty_type, penalty.ends_at || undefined)}
                </p>
                {penalty.ends_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Expires: {new Date(penalty.ends_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* No Issues Banner */}
        {!penalty && violations.length === 0 && disputes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-600">All Clear!</p>
                <p className="text-sm text-muted-foreground">
                  No violations or disputes on your account.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Violations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Violations</h3>
          </div>
          
          <div className="p-4">
            {violations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No violations recorded
              </p>
            ) : (
              <div className="space-y-3">
                {violations.slice(0, 5).map((violation) => (
                  <div key={violation.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {violation.violation_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(violation.created_at).toLocaleDateString()} at{' '}
                        {new Date(violation.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Disputes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Disputes</h3>
          </div>
          
          <div className="p-4">
            {disputes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No disputes filed
              </p>
            ) : (
              <div className="space-y-3">
                {disputes.map((dispute) => {
                  const isReporter = dispute.reporter_id === user?.id;
                  return (
                    <div key={dispute.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${disputeStatusColors[dispute.status]}`}>
                          {dispute.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isReporter ? 'You reported' : 'Reported against you'}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{dispute.reason}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Filed: {new Date(dispute.created_at).toLocaleDateString()}
                      </p>
                      {dispute.status === 'open' && (
                        <p className="text-xs text-primary mt-1">
                          Resolution deadline: {new Date(dispute.resolution_deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Policy Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <h3 className="font-semibold text-foreground mb-3">Violation Policy</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>1st violation:</strong> Warning</p>
            <p>• <strong>2nd violation:</strong> 1-hour messaging cooldown</p>
            <p>• <strong>3rd violation:</strong> 24-hour restriction</p>
            <p>• <strong>4th+ violation:</strong> Account review/suspension</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

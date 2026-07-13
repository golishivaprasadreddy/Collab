import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Clock, User, ChevronDown, ChevronUp, MessageSquare, CheckCircle, XCircle, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAdminDisputes, useResolveDispute, DisputeWithDetails } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

const statusColors: Record<string, string> = {
  open: "bg-red-500/20 text-red-600 border-red-500/30",
  under_review: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  resolved_favor_reporter: "bg-green-500/20 text-green-600 border-green-500/30",
  resolved_favor_reported: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  resolved_mutual: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  dismissed: "bg-gray-500/20 text-gray-600 border-gray-500/30",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved_favor_reporter: "Resolved (Reporter)",
  resolved_favor_reported: "Resolved (Reported)",
  resolved_mutual: "Mutual Resolution",
  dismissed: "Dismissed",
};

export function DisputesPanel() {
  const { data: disputes, isLoading } = useAdminDisputes();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!disputes?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No disputes to review</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {disputes.map((dispute) => (
        <DisputeCard
          key={dispute.id}
          dispute={dispute}
          isExpanded={expandedId === dispute.id}
          onToggle={() => setExpandedId(expandedId === dispute.id ? null : dispute.id)}
        />
      ))}
    </div>
  );
}

function DisputeCard({
  dispute,
  isExpanded,
  onToggle,
}: {
  dispute: DisputeWithDetails;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const resolveDispute = useResolveDispute();

  const handleResolve = (status: Database["public"]["Enums"]["dispute_status"]) => {
    resolveDispute.mutate(
      { disputeId: dispute.id, status, resolutionNotes },
      {
        onSuccess: () => {
          toast.success("Dispute resolved successfully");
          setResolutionNotes("");
        },
        onError: () => toast.error("Failed to resolve dispute"),
      }
    );
  };

  const isResolved = !["open", "under_review"].includes(dispute.status || "");

  return (
    <motion.div layout>
      <Card className={isResolved ? "opacity-60" : ""}>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={statusColors[dispute.status || "open"]}>
                  {statusLabels[dispute.status || "open"]}
                </Badge>
                {dispute.resolution_deadline && !isResolved && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Due: {format(new Date(dispute.resolution_deadline), "MMM d")}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-sm font-medium">
                {dispute.collaboration?.skill_needed || "Collaboration Dispute"}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {/* Reporter vs Reported */}
          <div className="flex items-center gap-3 text-sm mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={dispute.reporter_profile?.avatar_url || ""} />
                <AvatarFallback>
                  {dispute.reporter_profile?.full_name?.[0] || "R"}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">
                {dispute.reporter_profile?.full_name || "Reporter"}
              </span>
            </div>
            <span className="text-muted-foreground">vs</span>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={dispute.reported_profile?.avatar_url || ""} />
                <AvatarFallback>
                  {dispute.reported_profile?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">
                {dispute.reported_profile?.full_name || "Reported User"}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {/* Reason */}
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Reason for dispute:</p>
                  <p className="text-sm">{dispute.reason}</p>
                </div>

                {/* Resolution Notes (if resolved) */}
                {dispute.resolution_notes && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                    <p className="text-xs text-green-600 mb-1">Resolution Notes:</p>
                    <p className="text-sm">{dispute.resolution_notes}</p>
                  </div>
                )}

                {/* Admin Actions */}
                {!isResolved && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <Textarea
                      placeholder="Add resolution notes..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve("under_review")}
                        disabled={resolveDispute.isPending || dispute.status === "under_review"}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Under Review
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600"
                        onClick={() => handleResolve("resolved_favor_reporter")}
                        disabled={resolveDispute.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Favor Reporter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-600"
                        onClick={() => handleResolve("resolved_favor_reported")}
                        disabled={resolveDispute.isPending}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Favor Reported
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-purple-600 border-purple-600"
                        onClick={() => handleResolve("resolved_mutual")}
                        disabled={resolveDispute.isPending}
                      >
                        <Scale className="h-4 w-4 mr-1" />
                        Mutual
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="col-span-2 text-muted-foreground"
                        onClick={() => handleResolve("dismissed")}
                        disabled={resolveDispute.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mt-4">
                  Created: {format(new Date(dispute.created_at || ""), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

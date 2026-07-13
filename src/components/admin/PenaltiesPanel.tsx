import { useState } from "react";
import { format } from "date-fns";
import { Ban, AlertTriangle, Clock, Shield, XCircle, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminPenalties, useCreatePenalty, useUpdatePenalty, PenaltyWithDetails } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

const penaltyIcons: Record<Database["public"]["Enums"]["penalty_type"], typeof Ban> = {
  warning: AlertTriangle,
  cooldown: Clock,
  temporary_restriction: Shield,
  account_review: XCircle,
  permanent_ban: Ban,
};

const penaltyColors: Record<Database["public"]["Enums"]["penalty_type"], string> = {
  warning: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  cooldown: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  temporary_restriction: "bg-red-500/20 text-red-600 border-red-500/30",
  account_review: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  permanent_ban: "bg-red-700/20 text-red-700 border-red-700/30",
};

const penaltyLabels: Record<Database["public"]["Enums"]["penalty_type"], string> = {
  warning: "Warning",
  cooldown: "Cooldown",
  temporary_restriction: "Temporary Restriction",
  account_review: "Account Review",
  permanent_ban: "Permanent Ban",
};

export function PenaltiesPanel() {
  const { data: penalties, isLoading } = useAdminPenalties();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Penalty
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Penalty</DialogTitle>
            </DialogHeader>
            <CreatePenaltyForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {!penalties?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ban className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No penalties recorded</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {penalties.map((penalty) => (
            <PenaltyCard key={penalty.id} penalty={penalty} />
          ))}
        </div>
      )}
    </div>
  );
}

function PenaltyCard({ penalty }: { penalty: PenaltyWithDetails }) {
  const Icon = penaltyIcons[penalty.penalty_type] || Ban;
  const updatePenalty = useUpdatePenalty();

  const handleDeactivate = () => {
    updatePenalty.mutate(
      { id: penalty.id, updates: { is_active: false, ends_at: new Date().toISOString() } },
      {
        onSuccess: () => toast.success("Penalty deactivated"),
        onError: () => toast.error("Failed to deactivate penalty"),
      }
    );
  };

  return (
    <Card className={!penalty.is_active ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
              penaltyColors[penalty.penalty_type].split(" ")[0]
            }`}
          >
            <Icon className={`h-5 w-5 ${penaltyColors[penalty.penalty_type].split(" ")[1]}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={penalty.user_profile?.avatar_url || ""} />
                <AvatarFallback className="text-xs">
                  {penalty.user_profile?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">
                {penalty.user_profile?.full_name || "Unknown User"}
              </span>
              <Badge className={penaltyColors[penalty.penalty_type]}>
                {penaltyLabels[penalty.penalty_type]}
              </Badge>
              {!penalty.is_active && (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>
            {penalty.reason && (
              <p className="text-sm text-muted-foreground mb-2">{penalty.reason}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Started: {format(new Date(penalty.starts_at || penalty.created_at || ""), "MMM d, yyyy")}
              </span>
              {penalty.ends_at && (
                <span>
                  Ends: {format(new Date(penalty.ends_at), "MMM d, yyyy")}
                </span>
              )}
              {penalty.violation_count && penalty.violation_count > 0 && (
                <span>Violations: {penalty.violation_count}</span>
              )}
            </div>
          </div>
          {penalty.is_active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeactivate}
              disabled={updatePenalty.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Lift
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreatePenaltyForm({ onSuccess }: { onSuccess: () => void }) {
  const [userId, setUserId] = useState("");
  const [penaltyType, setPenaltyType] = useState<Database["public"]["Enums"]["penalty_type"]>("warning");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("");
  const createPenalty = useCreatePenalty();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please enter a user ID");
      return;
    }

    let endsAt: string | undefined;
    if (duration && penaltyType !== "permanent_ban") {
      const days = parseInt(duration, 10);
      if (!isNaN(days)) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
        endsAt = endDate.toISOString();
      }
    }

    createPenalty.mutate(
      { user_id: userId, penalty_type: penaltyType, reason, ends_at: endsAt },
      {
        onSuccess: () => {
          toast.success("Penalty created successfully");
          onSuccess();
        },
        onError: () => toast.error("Failed to create penalty"),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>User ID</Label>
        <Input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user UUID"
        />
      </div>
      <div>
        <Label>Penalty Type</Label>
        <Select value={penaltyType} onValueChange={(v) => setPenaltyType(v as Database["public"]["Enums"]["penalty_type"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="cooldown">Cooldown</SelectItem>
            <SelectItem value="temporary_restriction">Temporary Restriction</SelectItem>
            <SelectItem value="account_review">Account Review</SelectItem>
            <SelectItem value="permanent_ban">Permanent Ban</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Reason</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for penalty..."
        />
      </div>
      {penaltyType !== "permanent_ban" && (
        <div>
          <Label>Duration (days)</Label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Leave empty for indefinite"
          />
        </div>
      )}
      <Button type="submit" className="w-full" disabled={createPenalty.isPending}>
        {createPenalty.isPending ? "Creating..." : "Create Penalty"}
      </Button>
    </form>
  );
}

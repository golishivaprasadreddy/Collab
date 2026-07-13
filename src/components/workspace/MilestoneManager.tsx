import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Flag, Plus, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  completed: boolean | null;
  completed_at: string | null;
  created_at: string;
}

interface MilestoneManagerProps {
  workspaceId: string;
  milestones: Milestone[];
}

export function MilestoneManager({ workspaceId, milestones }: MilestoneManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMilestone, setNewMilestone] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddMilestone = async () => {
    if (!newMilestone.trim()) return;

    setIsCreating(true);
    try {
      const { error } = await supabase.from("workspace_milestones").insert({
        workspace_id: workspaceId,
        title: newMilestone.trim(),
      });

      if (error) throw error;

      setNewMilestone("");
      setShowInput(false);
      toast({ title: "Milestone added!" });
      queryClient.invalidateQueries({ queryKey: ["active-collaborations"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add milestone";
      toast({
        title: "Failed to add milestone",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleMilestone = async (id: string, currentlyCompleted: boolean | null) => {
    try {
      const { error } = await supabase
        .from("workspace_milestones")
        .update({
          completed: !currentlyCompleted,
          completed_at: !currentlyCompleted ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["active-collaborations"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update milestone";
      toast({
        title: "Failed to update milestone",
        description: message,
        variant: "destructive",
      });
    }
  };

  const completedCount = milestones.filter((m) => m.completed).length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Flag className="h-4 w-4 text-primary" />
          Milestones
          {milestones.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              ({completedCount}/{milestones.length})
            </span>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInput(!showInput)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {milestones.length > 0 && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      )}

      {showInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex gap-2"
        >
          <Input
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
            placeholder="New milestone..."
            className="h-10"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddMilestone();
            }}
          />
          <Button
            onClick={handleAddMilestone}
            size="sm"
            className="gradient-primary border-0"
            disabled={isCreating}
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </motion.div>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No milestones yet. Add key checkpoints!
            </p>
          ) : (
            milestones.map((milestone) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleToggleMilestone(milestone.id, milestone.completed)}
              >
                <CheckCircle2
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    milestone.completed ? "text-success" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`flex-1 text-sm ${
                    milestone.completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {milestone.title}
                </span>
                {milestone.completed && milestone.completed_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(milestone.completed_at).toLocaleDateString()}
                  </span>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

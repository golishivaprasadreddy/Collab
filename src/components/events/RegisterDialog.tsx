import { useState } from "react";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import type { Event } from "@/hooks/useEvents";

interface Props {
  event: Event;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function RegisterDialog({ event, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [loading, setLoading] = useState(false);

  const isTeamEvent = event.max_team_size > 1;
  const min = Math.max(event.min_team_size, 1);
  const max = event.max_team_size;
  // total participants includes self
  const totalParticipants = members.length + 1;

  const addMember = () => {
    const v = memberInput.trim();
    if (!v) return;
    if (totalParticipants >= max) {
      toast({ title: "Team full", description: `Max team size is ${max}`, variant: "destructive" });
      return;
    }
    setMembers([...members, v]);
    setMemberInput("");
  };

  const removeMember = (i: number) => setMembers(members.filter((_, idx) => idx !== i));

  const handleRegister = async () => {
    if (!user) return;
    if (isTeamEvent && totalParticipants < min) {
      toast({ title: "Need more members", description: `Min team size is ${min}`, variant: "destructive" });
      return;
    }
    if (isTeamEvent && !teamName.trim()) {
      toast({ title: "Team name required", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("event_registrations").insert({
      event_id: event.id,
      user_id: user.id,
      team_name: isTeamEvent ? teamName.trim() : null,
      team_members: isTeamEvent ? members.map((name) => ({ name })) : [],
    });
    setLoading(false);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Registered!", description: "You're in. Good luck 🎉" });
    qc.invalidateQueries({ queryKey: ["event-registrations", event.id] });
    onOpenChange(false);
    if (event.registration_link) window.open(event.registration_link, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Register for {event.title}
          </DialogTitle>
          <DialogDescription>
            {isTeamEvent
              ? `Team event — ${min === max ? `${min} members` : `${min}-${max} members`} required`
              : "Solo registration"}
          </DialogDescription>
        </DialogHeader>

        {isTeamEvent && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Team name</Label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Code Crusaders"
              />
            </div>
            <div className="space-y-2">
              <Label>Add teammates ({totalParticipants}/{max})</Label>
              <div className="flex gap-2">
                <Input
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  placeholder="Teammate name"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMember())}
                />
                <Button type="button" size="icon" onClick={addMember} disabled={totalParticipants >= max}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-xs">You (Captain)</Badge>
                {members.map((m, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1 pr-1">
                    {m}
                    <button onClick={() => removeMember(i)} className="hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRegister} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm Registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

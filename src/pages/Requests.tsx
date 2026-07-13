import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SkillBadge } from "@/components/ui/skill-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCollaborationRequests, useUpdateCollaborationRequest } from "@/hooks/useCollaborations";
import { REQUEST_EXPIRY_DAYS } from "@/utils/profileCompletion";

const collaborationTypeLabels = {
  learning: { label: "Learning", icon: "📚", color: "text-blue-600 bg-blue-100" },
  project: { label: "Project", icon: "💼", color: "text-purple-600 bg-purple-100" },
  paid: { label: "Paid", icon: "💰", color: "text-success bg-success/10" },
};

function isRequestExpired(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > REQUEST_EXPIRY_DAYS;
}

export default function Requests() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data, isLoading } = useCollaborationRequests();
  const updateRequest = useUpdateCollaborationRequest();

  // Filter out expired pending requests
  const incoming = useMemo(() => 
    (data?.incoming || []).filter((r) => r.status !== "pending" || !isRequestExpired(r.created_at)),
    [data?.incoming]
  );
  const sent = useMemo(() => 
    (data?.sent || []).filter((r) => r.status !== "pending" || !isRequestExpired(r.created_at)),
    [data?.sent]
  );

  const handleAccept = async (id: string) => {
    try {
      await updateRequest.mutateAsync({ id, updates: { status: "accepted" } });
      toast({ title: "Request accepted! 🎉", description: "You can now start chatting." });
    } catch (error) {
      toast({ title: "Failed to accept", variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateRequest.mutateAsync({ id, updates: { status: "rejected" } });
      toast({ title: "Request declined" });
    } catch (error) {
      toast({ title: "Failed to decline", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="flex items-center gap-1 text-xs text-warning"><Clock className="h-3 w-3" />Pending</span>;
      case "accepted": case "ongoing": return <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3 w-3" />Accepted</span>;
      case "rejected": return <span className="flex items-center gap-1 text-xs text-destructive"><XCircle className="h-3 w-3" />Rejected</span>;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const RequestCard = ({ request, type }: { request: NonNullable<typeof data>['incoming'][number] | NonNullable<typeof data>['sent'][number]; type: "incoming" | "sent" }) => {
    const profile = type === "incoming" ? request.requester_profile : request.requestee_profile;
    const initials = profile?.full_name?.[0]?.toUpperCase() || "?";
    const collabType = collaborationTypeLabels[request.collaboration_type as keyof typeof collaborationTypeLabels];

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-4 border border-border shadow-card">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground truncate">{profile?.full_name || "Unknown"}</h3>
              {getStatusBadge(request.status)}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <SkillBadge size="sm">{request.skill_needed}</SkillBadge>
              <span className="text-xs text-muted-foreground">• {request.purpose}</span>
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${collabType?.color}`}>
                {collabType?.icon} {collabType?.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{request.description}</p>
          </div>
        </div>

        {type === "incoming" && request.status === "pending" && (
          <div className="flex gap-3 mt-4">
            <Button onClick={() => handleAccept(request.id)} className="flex-1 h-11 gradient-primary border-0"><Check className="h-4 w-4 mr-2" />Accept</Button>
            <Button onClick={() => handleReject(request.id)} variant="outline" className="flex-1 h-11"><X className="h-4 w-4 mr-2" />Decline</Button>
          </div>
        )}

        {(request.status === "accepted" || request.status === "ongoing") && (
          <Button onClick={() => navigate(`/collaboration/${request.id}`)} className="w-full mt-4 h-11" variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />Open Workspace
          </Button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Requests</h1>
        <p className="text-muted-foreground mt-1">Manage your collaboration requests</p>
      </div>

      <Tabs defaultValue="incoming" className="px-4">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="incoming">Incoming {incoming.filter(r => r.status === "pending").length > 0 && <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{incoming.filter(r => r.status === "pending").length}</span>}</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>
        <TabsContent value="incoming" className="mt-4 space-y-4">
          <AnimatePresence>
            {incoming.length > 0 ? incoming.map((req) => <RequestCard key={req.id} request={req} type="incoming" />) : (
              <div className="text-center py-12"><div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4"><MessageCircle className="h-8 w-8 text-muted-foreground" /></div><p className="text-muted-foreground">No incoming requests</p></div>
            )}
          </AnimatePresence>
        </TabsContent>
        <TabsContent value="sent" className="mt-4 space-y-4">
          <AnimatePresence>
            {sent.length > 0 ? sent.map((req) => <RequestCard key={req.id} request={req} type="sent" />) : (
              <div className="text-center py-12"><div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4"><MessageCircle className="h-8 w-8 text-muted-foreground" /></div><p className="text-muted-foreground">No sent requests</p></div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}

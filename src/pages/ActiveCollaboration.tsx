import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  MessageCircle,
  IndianRupee,
  Circle,
  ListTodo,
  Flag,
  FileText,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useActiveCollaborations, useCreateTask, useUpdateTask, useUpdateCollaborationRequest } from "@/hooks/useCollaborations";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/workspace/FileUpload";
import { MilestoneManager } from "@/components/workspace/MilestoneManager";
import { MeetingScheduler } from "@/components/calendar/MeetingScheduler";
import { ReportDisputeDialog, DisputeBanner } from "@/components/collaboration/ReportDispute";
import { PaymentRequired, PaymentPending, PaymentConfirmed } from "@/components/collaboration/PaymentStatus";
import { useDisputeForCollaboration } from "@/hooks/useDisputes";

const statusColors = {
  todo: "text-muted-foreground",
  in_progress: "text-warning",
  completed: "text-success",
};

const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
};

export default function ActiveCollaboration() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: collaborations } = useActiveCollaborations();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const updateRequest = useUpdateCollaborationRequest();

  const [newTask, setNewTask] = useState("");
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);

  const { data: activeDispute } = useDisputeForCollaboration(id);

  const collaboration = collaborations?.find((c) => c.id === id);

  if (!collaboration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Collaboration not found</p>
      </div>
    );
  }

  const isRequester = collaboration.requester_id === user?.id;
  const partner = isRequester ? collaboration.requestee_profile : collaboration.requester_profile;
  const partnerInitials = partner?.full_name?.[0]?.toUpperCase() || "?";

  const isPaid = collaboration.collaboration_type === "paid";
  const paymentStatus = collaboration.payment_status;
  const isPaymentConfirmed = paymentStatus === "confirmed" || paymentStatus === "paid";
  const isPaymentPending = paymentStatus === "pending";
  const needsPayment = isPaid && !isPaymentConfirmed && !isPaymentPending;
  
  const hasConfirmed = isRequester
    ? collaboration.requester_confirmed_completion
    : collaboration.requestee_confirmed_completion;

  // Check if workspace features should be locked (paid but not paid yet)
  const workspaceLocked = isPaid && !isPaymentConfirmed;

  // Check for active dispute
  const hasActiveDispute = !!activeDispute;

  const handleAddTask = async () => {
    if (!newTask.trim() || !collaboration.workspace?.id) return;

    try {
      await createTask.mutateAsync({
        workspace_id: collaboration.workspace.id,
        title: newTask.trim(),
      });
      setNewTask("");
      setShowTaskInput(false);
      toast({ title: "Task added!" });
    } catch (error) {
      toast({ title: "Failed to add task", variant: "destructive" });
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    if (!collaboration.workspace?.id) return;

    const newStatus = currentStatus === "completed" ? "todo" : "completed";
    try {
      await updateTask.mutateAsync({
        id: taskId,
        workspace_id: collaboration.workspace.id,
        updates: { status: newStatus as "todo" | "in_progress" | "completed" },
      });
    } catch (error) {
      toast({ title: "Failed to update task", variant: "destructive" });
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      const updates = isRequester
        ? { requester_confirmed_completion: true }
        : { requestee_confirmed_completion: true };

      // Check if both parties will have confirmed after this update
      const bothConfirmed =
        (isRequester && collaboration.requestee_confirmed_completion) ||
        (!isRequester && collaboration.requester_confirmed_completion);

      await updateRequest.mutateAsync({
        id: collaboration.id,
        updates: bothConfirmed ? { ...updates, status: "completed" } : updates,
      });

      if (bothConfirmed) {
        toast({
          title: "Collaboration completed! 🎉",
          description: "Time to rate your experience.",
        });
        navigate(`/complete/${collaboration.id}`);
      } else {
        toast({
          title: "Completion confirmed",
          description: "Waiting for the other party to confirm.",
        });
      }
    } catch (error) {
      toast({ title: "Failed to confirm completion", variant: "destructive" });
    }
  };

  const completedTasks = collaboration.tasks?.filter((t) => t.status === "completed").length || 0;
  const totalTasks = collaboration.tasks?.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-hero px-4 pt-4 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-primary-foreground">
              Active Collaboration
            </h1>
            <p className="text-sm text-primary-foreground/80">
              {collaboration.skill_needed}
            </p>
          </div>
          {/* Report button */}
          <button
            onClick={() => setShowDisputeDialog(true)}
            className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground"
            title="Report an issue"
          >
            <AlertTriangle className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Dispute banner if active */}
        {hasActiveDispute && (
          <DisputeBanner 
            disputeStatus={activeDispute!.status} 
            isReporter={activeDispute!.reporter_id === user?.id} 
          />
        )}

        {/* Payment section for paid collaborations */}
        {isPaid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isPaymentConfirmed ? (
              <PaymentConfirmed amount={collaboration.agreed_amount || 0} />
            ) : isPaymentPending ? (
              <PaymentPending message="Payment is being processed. Workspace will unlock once confirmed." />
            ) : needsPayment && isRequester ? (
              <PaymentRequired 
                amount={collaboration.agreed_amount || 0}
                collaborationId={collaboration.id}
              />
            ) : needsPayment && !isRequester ? (
              <PaymentPending message="Waiting for the requester to complete payment." />
            ) : null}
          </motion.div>
        )}

        {/* Status card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 border border-border shadow-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
              <span className="font-medium text-foreground">Status: Ongoing</span>
            </div>
            {isPaid && (
              <span className="flex items-center gap-1 text-sm font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                <IndianRupee className="h-4 w-4" />
                {collaboration.agreed_amount?.toLocaleString()}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {totalTasks > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">
                  {completedTasks}/{totalTasks} tasks
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Partner info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <h3 className="font-semibold text-foreground mb-3">Collaborating with</h3>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={partner?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {partnerInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-foreground">{partner?.full_name}</p>
              <p className="text-sm text-muted-foreground">{partner?.college}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/messages")}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Tabs for Tasks, Milestones, Files */}
        {workspaceLocked ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <ListTodo className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Workspace Locked</h3>
              <p className="text-sm text-muted-foreground">
                Complete the payment to unlock tasks, milestones, files, and calendar features.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-12 rounded-none border-b border-border bg-transparent">
                <TabsTrigger value="tasks" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <ListTodo className="h-4 w-4 mr-1" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="milestones" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Flag className="h-4 w-4 mr-1" />
                  Milestones
                </TabsTrigger>
                <TabsTrigger value="calendar" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Calendar className="h-4 w-4 mr-1" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="files" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <FileText className="h-4 w-4 mr-1" />
                  Files
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="p-4 m-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Tasks</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTaskInput(!showTaskInput)}
                    disabled={hasActiveDispute}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {showTaskInput && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="New task..."
                      className="h-10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTask();
                      }}
                    />
                    <Button onClick={handleAddTask} size="sm" className="gradient-primary border-0">
                      Add
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  {collaboration.tasks?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tasks yet. Add some to track progress!
                    </p>
                  ) : (
                    collaboration.tasks?.map((task) => {
                      const StatusIcon = statusIcons[task.status];
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <Checkbox
                            checked={task.status === "completed"}
                            onCheckedChange={() => handleToggleTask(task.id, task.status)}
                            disabled={hasActiveDispute}
                          />
                          <span
                            className={`flex-1 text-sm ${
                              task.status === "completed"
                                ? "line-through text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </span>
                          <StatusIcon className={`h-4 w-4 ${statusColors[task.status]}`} />
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="milestones" className="p-4 m-0">
                {collaboration.workspace?.id && (
                  <MilestoneManager
                    workspaceId={collaboration.workspace.id}
                    milestones={collaboration.milestones || []}
                  />
                )}
              </TabsContent>

              <TabsContent value="calendar" className="p-4 m-0">
                <MeetingScheduler collaborationRequestId={collaboration.id} />
              </TabsContent>

              <TabsContent value="files" className="p-4 m-0">
                {collaboration.workspace?.id && (
                  <FileUpload workspaceId={collaboration.workspace.id} />
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* Completion confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <h3 className="font-semibold text-foreground mb-3">Mark as Completed</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Both parties must confirm completion to finalize the collaboration.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                collaboration.requester_confirmed_completion
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Requester</span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                collaboration.requestee_confirmed_completion
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Collaborator</span>
            </div>
          </div>

          <Button
            onClick={handleConfirmCompletion}
            className="w-full h-12 gradient-primary border-0"
            disabled={hasConfirmed || hasActiveDispute || workspaceLocked}
          >
            {hasActiveDispute 
              ? "Dispute in Progress" 
              : workspaceLocked 
              ? "Payment Required" 
              : hasConfirmed 
              ? "Waiting for partner..." 
              : "Confirm Completion"}
          </Button>
        </motion.div>
      </div>

      {/* Dispute dialog */}
      <ReportDisputeDialog
        open={showDisputeDialog}
        onOpenChange={setShowDisputeDialog}
        collaborationId={collaboration.id}
        reportedUserId={partner?.id || ""}
        reportedUserName={partner?.full_name || "Unknown"}
      />
    </div>
  );
}

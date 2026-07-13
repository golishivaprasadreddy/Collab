import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Send, CheckCircle2, Loader2, Phone, Archive, 
  MessageCircle, Users, Lock, Pin, PinOff, UserPlus, UserMinus, X
} from "lucide-react";
import { PaymentSplitRequest } from "@/components/messages/PaymentSplitRequest";
import { useNavigate } from "react-router-dom";
import { useMessages, useSendMessage, useConversations } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useReadReceipts } from "@/hooks/useReadReceipts";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { ViolationWarning, PenaltyBanner, ChatRestricted } from "@/components/messages/ViolationWarning";
import { moderateContent } from "@/utils/contentModeration";
import { useCanSendMessages, useRecordViolation } from "@/hooks/useContentModeration";
import { usePinnedMessages, usePinMessage, useUnpinMessage } from "@/hooks/usePinnedMessages";
import { useProjectGroups, useBroadcastToGroup, useGroupMessages, type ProjectGroup } from "@/hooks/useProjectGroups";
import { useGroupUnread } from "@/hooks/useGroupUnread";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [selectedGroupSig, setSelectedGroupSig] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showPinned, setShowPinned] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: loadingConvos } = useConversations();
  const { groups, dms, archived } = useProjectGroups();
  const { unreadCounts, markGroupRead } = useGroupUnread(groups);
  const { data: messages = [], isLoading: loadingMessages } = useMessages(selectedConvoId || undefined);
  const sendMessage = useSendMessage();
  const broadcastMessage = useBroadcastToGroup();
  const { isPartnerTyping, startTyping, stopTyping } = useTypingIndicator(selectedConvoId || undefined);
  const { markMessagesAsRead } = useReadReceipts(selectedConvoId || undefined);
  const { canSend, penalty, isLoading: penaltyLoading } = useCanSendMessages();
  const recordViolation = useRecordViolation();
  const { data: pinnedMessages = [] } = usePinnedMessages(selectedConvoId || undefined);
  const pinMessage = usePinMessage();
  const unpinMessage = useUnpinMessage();
  const { toast } = useToast();
  const [violationMessage, setViolationMessage] = useState<string | null>(null);

  const selectedGroup: ProjectGroup | undefined = selectedGroupSig
    ? groups.find((g) => g.signature === selectedGroupSig)
    : undefined;
  const { data: groupMessages = [], isLoading: loadingGroupMessages } = useGroupMessages(
    selectedGroup?.collaborationIds || []
  );

  // Active DMs are kept separately; archived are completed.
  const activeConversations = dms;
  const archivedConversations = archived;

  const pinnedMessageIds = new Set(pinnedMessages.map(p => p.message_id));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (messages.length > 0) {
      const unreadMessageIds = messages
        .filter((m) => !m.is_read && m.sender_id !== user?.id)
        .map((m) => m.id);
      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(unreadMessageIds);
      }
    }
  }, [messages, user?.id, markMessagesAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConvoId) return;

    const moderation = moderateContent(newMessage);
    if (moderation.isBlocked) {
      setViolationMessage(moderation.message || "This message contains prohibited content");
      try {
        await recordViolation.mutateAsync({
          violation_type: moderation.violations[0],
          blocked_content: moderation.blockedContent,
          collaboration_request_id: selectedConvoId,
        });
      } catch (error) {
        console.error("Failed to record violation:", error);
      }
      toast({
        title: "Message blocked",
        description: moderation.message,
        variant: "destructive",
      });
      return;
    }

    stopTyping();
    setViolationMessage(null);

    try {
      await sendMessage.mutateAsync({
        collaboration_request_id: selectedConvoId,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    startTyping();
  };

  const handlePinToggle = async (messageId: string) => {
    if (!selectedConvoId) return;
    const isPinned = pinnedMessageIds.has(messageId);
    try {
      if (isPinned) {
        await unpinMessage.mutateAsync({ collaboration_request_id: selectedConvoId, message_id: messageId });
        toast({ title: "Message unpinned" });
      } else {
        await pinMessage.mutateAsync({ collaboration_request_id: selectedConvoId, message_id: messageId });
        toast({ title: "Message pinned 📌" });
      }
    } catch {
      toast({ title: "Failed to update pin", variant: "destructive" });
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConvoId);
  const isArchivedChat = selectedConversation?.status === "completed";

  const handleSendGroupMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;
    const moderation = moderateContent(newMessage);
    if (moderation.isBlocked) {
      setViolationMessage(moderation.message || "This message contains prohibited content");
      try {
        await recordViolation.mutateAsync({
          violation_type: moderation.violations[0],
          blocked_content: moderation.blockedContent,
          collaboration_request_id: selectedGroup.collaborationIds[0],
        });
      } catch (e) { /* noop */ }
      toast({ title: "Message blocked", description: moderation.message, variant: "destructive" });
      return;
    }
    setViolationMessage(null);
    try {
      await broadcastMessage.mutateAsync({
        collaborationIds: selectedGroup.collaborationIds,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      toast({ title: "Failed to send", variant: "destructive" });
    }
  };

  // Mark group as read whenever it's open
  useEffect(() => {
    if (selectedGroupSig) markGroupRead(selectedGroupSig);
  }, [selectedGroupSig, groupMessages.length, markGroupRead]);

  // ===== Group chat view =====
  if (selectedGroupSig && selectedGroup) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSelectedGroupSig(null)}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">
              {selectedGroup.skill} – Team
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {selectedGroup.members.length + 1} members • {selectedGroup.purpose}
            </p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Team members"
              >
                <Users className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Team Members ({selectedGroup.members.length + 1})</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">You</p>
                    <p className="text-xs text-muted-foreground">Project lead</p>
                  </div>
                </div>
                {selectedGroup.members.map((m) => (
                  <div key={m.collaborationId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={m.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">{m.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">Member</p>
                    </div>
                    <button
                      onClick={() => { setSelectedGroupSig(null); setSelectedConvoId(m.collaborationId); }}
                      className="text-xs text-primary hover:underline"
                      title="Open private chat"
                    >
                      DM
                    </button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-3 border-t border-border">
                  💡 Members are auto-added when you create a collaboration with the same skill, purpose, and description.
                  Use the <span className="font-medium text-foreground">DM</span> button to chat with one member privately.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="bg-primary/10 px-4 py-3 flex items-center gap-3">
          <Users className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Project group chat</p>
            <p className="text-xs text-muted-foreground">
              Messages broadcast to all {selectedGroup.members.length} teammate{selectedGroup.members.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loadingGroupMessages ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : groupMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Say hi to your team!</p>
            </div>
          ) : (
            groupMessages.map((m) => (
              <div key={m.id} className="space-y-1">
                {m.sender_id !== user?.id && (
                  <p className="text-[11px] text-muted-foreground ml-1">
                    {m.sender_profile?.full_name || "Member"}
                  </p>
                )}
                <MessageBubble message={m} isMe={m.sender_id === user?.id} />
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {violationMessage && (
          <ViolationWarning message={violationMessage} onDismiss={() => setViolationMessage(null)} />
        )}

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 safe-area-inset-bottom">
          <div className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={canSend ? "Message the team..." : "Messaging restricted"}
              className="h-12"
              disabled={!canSend || penaltyLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendGroupMessage();
                }
              }}
              onPaste={(e) => e.preventDefault()}
            />
            <Button
              onClick={handleSendGroupMessage}
              size="icon"
              className="h-12 w-12 gradient-primary border-0"
              disabled={!newMessage.trim() || broadcastMessage.isPending || !canSend}
            >
              {broadcastMessage.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }


  // Chat view
  if (selectedConvoId && selectedConversation) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Chat header */}
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => { setSelectedConvoId(null); setShowPinned(false); }}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedConversation.participantAvatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {selectedConversation.participantName[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">
              {selectedConversation.skill} – Team
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {selectedConversation.participantName} • {selectedConversation.status}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {/* Pinned messages toggle */}
            <button
              onClick={() => setShowPinned(!showPinned)}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors relative ${
                showPinned ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
              }`}
              aria-label="Pinned messages"
            >
              <Pin className="h-5 w-5" />
              {pinnedMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                  {pinnedMessages.length}
                </span>
              )}
            </button>

            {/* Team members sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Team members"
                >
                  <Users className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Team Members</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* Current user */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">You</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">You</p>
                      <p className="text-xs text-muted-foreground">Member</p>
                    </div>
                  </div>
                  {/* Partner */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.participantAvatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedConversation.participantName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{selectedConversation.participantName}</p>
                      <p className="text-xs text-muted-foreground">Member</p>
                    </div>
                    {!isArchivedChat && (
                      <button
                        onClick={() => navigate(`/u/${selectedConversation.participantId}`)}
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </button>
                    )}
                  </div>

                  {!isArchivedChat && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-3">
                        Team members are automatically added when a collaboration is accepted. 
                        To add more members, create new collaboration requests.
                      </p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {!isArchivedChat && (
              <>
                <PaymentSplitRequest
                  partnerName={selectedConversation.participantName}
                  onSend={async (message) => {
                    if (!selectedConvoId) return;
                    try {
                      await sendMessage.mutateAsync({
                        collaboration_request_id: selectedConvoId,
                        content: message,
                      });
                    } catch (error) {
                      console.error("Failed to send split request:", error);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    toast({
                      title: "Calling...",
                      description: `Initiating call with ${selectedConversation.participantName}`,
                    });
                  }}
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                  aria-label="Call"
                >
                  <Phone className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Project status banner */}
        {isArchivedChat ? (
          <div className="bg-muted px-4 py-3 flex items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Project completed – Chat archived
              </p>
              <p className="text-xs text-muted-foreground">
                This chat is read-only. You can view past messages.
              </p>
            </div>
          </div>
        ) : selectedConversation.status === "accepted" || selectedConversation.status === "ongoing" ? (
          <div className="bg-primary/10 px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Collaboration active
              </p>
              <p className="text-xs text-muted-foreground">
                View workspace to manage tasks & milestones
              </p>
            </div>
            <Button 
              size="sm" 
              className="gradient-primary border-0"
              onClick={() => navigate(`/collaboration/${selectedConvoId}`)}
            >
              Workspace
            </Button>
          </div>
        ) : null}

        {/* Pinned messages panel */}
        {showPinned && (
          <div className="bg-card border-b border-border">
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <Pin className="h-4 w-4 text-primary" />
                Pinned Messages ({pinnedMessages.length})
              </span>
              <button onClick={() => setShowPinned(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {pinnedMessages.length === 0 ? (
              <p className="px-4 pb-3 text-xs text-muted-foreground">No pinned messages yet. Long-press a message to pin it.</p>
            ) : (
              <div className="px-4 pb-3 space-y-2 max-h-40 overflow-y-auto">
                {pinnedMessages.map((pin) => (
                  <div key={pin.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                    <Pin className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-primary/80">{pin.sender_profile?.full_name || "Unknown"}</p>
                      <p className="text-foreground truncate">{pin.message?.content}</p>
                    </div>
                    {!isArchivedChat && (
                      <button
                        onClick={() => pin.message?.id && handlePinToggle(pin.message.id)}
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      >
                        <PinOff className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team members info */}
        <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Team: You, {selectedConversation.participantName}</span>
        </div>

        {/* Penalty banner if applicable */}
        {penalty && penalty.penalty_type !== 'warning' && (
          <PenaltyBanner penaltyType={penalty.penalty_type} endsAt={penalty.ends_at} />
        )}

        {/* Messages or restricted view */}
        {!canSend && penalty && penalty.penalty_type !== 'warning' && !isArchivedChat ? (
          <ChatRestricted 
            reason={`Your messaging is restricted due to policy violations. ${penalty.ends_at ? `Restriction ends at ${new Date(penalty.ends_at).toLocaleTimeString()}` : 'Please contact support.'}`} 
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {loadingMessages ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="group relative">
                  <MessageBubble
                    message={message}
                    isMe={message.sender_id === user?.id}
                  />
                  {/* Pin button on hover/tap */}
                  {!isArchivedChat && (
                    <button
                      onClick={() => handlePinToggle(message.id)}
                      className={`absolute top-1 ${message.sender_id === user?.id ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-full flex items-center justify-center ${
                        pinnedMessageIds.has(message.id) 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-muted text-muted-foreground hover:text-primary'
                      }`}
                      title={pinnedMessageIds.has(message.id) ? "Unpin" : "Pin"}
                    >
                      {pinnedMessageIds.has(message.id) ? (
                        <PinOff className="h-3 w-3" />
                      ) : (
                        <Pin className="h-3 w-3" />
                      )}
                    </button>
                  )}
                  {/* Pin indicator */}
                  {pinnedMessageIds.has(message.id) && (
                    <div className={`flex items-center gap-1 mt-0.5 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <Pin className="h-3 w-3 text-primary" />
                      <span className="text-[10px] text-primary">Pinned</span>
                    </div>
                  )}
                </div>
              ))
            )}
            {!isArchivedChat && (
              <TypingIndicator 
                isTyping={isPartnerTyping} 
                name={selectedConversation.participantName.split(" ")[0]}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Violation warning */}
        {violationMessage && (
          <ViolationWarning 
            message={violationMessage} 
            onDismiss={() => setViolationMessage(null)} 
          />
        )}

        {/* Warning banner for first violation */}
        {penalty && penalty.penalty_type === 'warning' && !isArchivedChat && (
          <div className="mx-4 mb-2">
            <PenaltyBanner penaltyType={penalty.penalty_type} endsAt={penalty.ends_at} />
          </div>
        )}

        {/* Message input - only for active chats */}
        {!isArchivedChat ? (
          <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 safe-area-inset-bottom">
            <div className="flex gap-3">
              <Input
                value={newMessage}
                onChange={handleInputChange}
                placeholder={canSend ? "Type a message..." : "Messaging restricted"}
                className="h-12"
                disabled={!canSend || penaltyLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                onBlur={stopTyping}
                onPaste={(e) => e.preventDefault()}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="h-12 w-12 gradient-primary border-0"
                disabled={!newMessage.trim() || sendMessage.isPending || !canSend}
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="sticky bottom-0 bg-muted/50 backdrop-blur-sm border-t border-border p-4 safe-area-inset-bottom text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              This chat is archived – read only
            </p>
          </div>
        )}
      </div>
    );
  }

  // Conversations list
  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Your collaboration team chats</p>
      </div>

      {loadingConvos ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="px-4">
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground">No messages yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Start collaborating to chat with others
            </p>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => navigate("/search")}
            >
              Find collaborators
            </Button>
          </div>
        </div>
      ) : (
        <Tabs defaultValue={groups.length > 0 ? "groups" : "active"} className="px-4">
          <TabsList className="grid w-full grid-cols-3 h-11 mb-4">
            <TabsTrigger value="groups" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Groups
              {groups.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {groups.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" />
              DMs
              {activeConversations.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {activeConversations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-1.5">
              <Archive className="h-4 w-4" />
              Archived
              {archivedConversations.length > 0 && (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                  {archivedConversations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-3 mt-0">
            <AnimatePresence>
              {groups.length > 0 ? (
                groups.map((g) => (
                  <GroupCard
                    key={g.signature}
                    group={g}
                    unread={unreadCounts[g.signature] || 0}
                    onSelect={setSelectedGroupSig}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No project groups yet</p>
                  <p className="text-muted-foreground text-xs mt-1 max-w-xs mx-auto">
                    Send the same project (skill + purpose + description) to multiple people — they'll be auto-grouped here.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="active" className="space-y-3 mt-0">
            <AnimatePresence>
              {activeConversations.length > 0 ? (
                activeConversations.map((convo) => (
                  <ConversationCard key={convo.id} convo={convo} onSelect={setSelectedConvoId} />
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No 1:1 chats</p>
                  <p className="text-muted-foreground text-xs mt-1">Accept a collaboration request to start chatting</p>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="archived" className="space-y-3 mt-0">
            <AnimatePresence>
              {archivedConversations.length > 0 ? (
                archivedConversations.map((convo) => (
                  <ConversationCard key={convo.id} convo={convo} onSelect={setSelectedConvoId} isArchived />
                ))
              ) : (
                <div className="text-center py-8">
                  <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No archived chats</p>
                  <p className="text-muted-foreground text-xs mt-1">Completed projects will appear here</p>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function GroupCard({
  group,
  unread,
  onSelect,
}: {
  group: ProjectGroup;
  unread: number;
  onSelect: (sig: string) => void;
}) {
  const hasUnread = unread > 0;
  return (
    <motion.button
      onClick={() => onSelect(group.signature)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`w-full bg-card rounded-xl p-4 border shadow-card text-left flex items-center gap-4 transition-colors ${
        hasUnread ? "border-primary/60 bg-primary/[0.03]" : "border-border hover:border-primary/50"
      }`}
    >
      <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
        <Users className="h-6 w-6 text-primary" />
        <span className="absolute -bottom-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
          {group.members.length + 1}
        </span>
        {hasUnread && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold ring-2 ring-card"
          >
            {unread > 99 ? "99+" : unread}
          </motion.span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground truncate">{group.skill} – Team</h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">{group.lastMessageTime}</span>
        </div>
        <p className="text-xs text-primary/80 mb-0.5 truncate">
          {group.members.map((m) => m.name).join(", ")}
        </p>
        <p className={`text-sm truncate ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {group.lastMessage}
        </p>
      </div>
    </motion.button>
  );
}

function ConversationCard({ 
  convo, 
  onSelect, 
  isArchived = false 
}: {
  convo: {
    id: string;
    participantName: string;
    participantAvatar?: string | null;
    unread: number;
    skill: string;
    lastMessageTime: string;
  };
  onSelect: (id: string) => void;
  isArchived?: boolean;
}) {
  const initials = convo.participantName[0]?.toUpperCase() || "?";

  return (
    <motion.button
      onClick={() => onSelect(convo.id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`w-full bg-card rounded-xl p-4 border shadow-card text-left flex items-center gap-4 hover:border-primary/50 transition-colors ${
        isArchived ? "border-border/50 opacity-80" : "border-border"
      }`}
    >
      <div className="relative">
        <Avatar className="h-14 w-14">
          <AvatarImage src={convo.participantAvatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {isArchived && (
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </span>
        )}
        {!isArchived && convo.unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-medium">
            {convo.unread}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground truncate">
            {convo.skill} – Team
          </h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {convo.lastMessageTime}
          </span>
        </div>
        <p className="text-xs text-primary/80 mb-0.5 flex items-center gap-1">
          <Users className="h-3 w-3" />
          {convo.participantName}
        </p>
        <p
          className={`text-sm truncate ${
            !isArchived && convo.unread > 0
              ? "text-foreground font-medium"
              : "text-muted-foreground"
          }`}
        >
          {convo.lastMessage}
        </p>
      </div>

      {isArchived && (
        <Badge variant="outline" className="flex-shrink-0 text-[10px]">
          <Archive className="h-3 w-3 mr-1" />
          Done
        </Badge>
      )}
    </motion.button>
  );
}

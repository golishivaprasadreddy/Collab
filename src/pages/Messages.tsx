import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, useMessages, useSendMessage } from "@/hooks/useMessages";
import {
  Send,
  ArrowLeft,
  Loader2,
  Users,
  MessageCircle,
  Archive,
  Lock,
  Phone,
  CheckCircle2,
  Pin,
  PinOff,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { PaymentSplitRequest } from "@/components/messages/PaymentSplitRequest";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useToast } from "@/hooks/use-toast";
import { moderateContent } from "@/utils/contentModeration";
import { ViolationWarning, PenaltyBanner, ChatRestricted } from "@/components/messages/ViolationWarning";
import {
  useActivePenalty,
  useRecordViolation,
  useCanSendMessages,
} from "@/hooks/useContentModeration";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useProjectGroups,
  useGroupMessages,
  useBroadcastToGroup,
  type ProjectGroup,
} from "@/hooks/useProjectGroups";
import { useGroupUnread } from "@/hooks/useGroupUnread";
import { usePinnedMessages, usePinMessage, useUnpinMessage } from "@/hooks/usePinnedMessages";

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [selectedGroupSig, setSelectedGroupSig] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [violationMessage, setViolationMessage] = useState<string | null>(null);
  const [showPinned, setShowPinned] = useState(false);

  const { data: penalty, isLoading: penaltyLoading } = useActivePenalty();
  const { canSend } = useCanSendMessages();
  const recordViolation = useRecordViolation();

  const {
    conversations,
    isLoading: loadingConvos,
    markMessagesAsRead,
  } = useConversations();
  const { messages, isLoading: loadingMessages } = useMessages(selectedConvoId || undefined);
  const sendMessage = useSendMessage();

  const { isPartnerTyping, startTyping, stopTyping } = useTypingIndicator(
    selectedConvoId || undefined
  );

  const { data: groups = [] } = useProjectGroups();
  const { unreadCounts, markGroupRead } = useGroupUnread(groups);
  const selectedGroup = groups.find((g) => g.signature === selectedGroupSig);
  const { data: groupMessages = [], isLoading: loadingGroupMessages } =
    useGroupMessages(selectedGroup ? selectedGroup.collaborationIds : []);
  const broadcastMessage = useBroadcastToGroup();

  const { data: pinnedMessages = [] } = usePinnedMessages(selectedConvoId || undefined);
  const pinMessage = usePinMessage();
  const unpinMessage = useUnpinMessage();
  const pinnedMessageIds = new Set(pinnedMessages.map((p) => p.message_id));

  const activeConversations = conversations.filter((c) => c.status !== "completed");
  const archivedConversations = conversations.filter((c) => c.status === "completed");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, groupMessages]);

  useEffect(() => {
    if (selectedConvoId && messages.length > 0) {
      const unreadMessageIds = messages
        .filter((m) => !m.is_read && m.sender_id !== user?.id)
        .map((m) => m.id);
      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(unreadMessageIds);
      }
    }
  }, [messages, user?.id, markMessagesAsRead, selectedConvoId]);

  useEffect(() => {
    if (selectedGroupSig) markGroupRead(selectedGroupSig);
  }, [selectedGroupSig, groupMessages.length, markGroupRead]);

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

  // Render Chat Window inside panel or full screen
  const renderChatArea = () => {
    if (selectedGroupSig && selectedGroup) {
      return (
        <div className="flex-1 flex flex-col bg-background h-full">
          <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSelectedGroupSig(null)}
              className="lg:hidden h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-foreground truncate">
                {selectedGroup.skill} – Team
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {selectedGroup.members.length + 1} members • {selectedGroup.purpose}
              </p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Team members"
                >
                  <Users className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-sm">Team Members ({selectedGroup.members.length + 1})</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">You</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">You</p>
                      <p className="text-[11px] text-muted-foreground">Project lead</p>
                    </div>
                  </div>
                  {selectedGroup.members.map((m) => (
                    <div key={m.collaborationId} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={m.avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{m.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">Member</p>
                      </div>
                      <button
                        onClick={() => { setSelectedGroupSig(null); setSelectedConvoId(m.collaborationId); }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        DM
                      </button>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loadingGroupMessages ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : groupMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-xs">No messages yet. Say hi to your team!</p>
              </div>
            ) : (
              groupMessages.map((m) => (
                <div key={m.id} className="space-y-1">
                  {m.sender_id !== user?.id && (
                    <p className="text-[11px] text-muted-foreground font-medium ml-1">
                      {m.sender_profile?.full_name || "Member"}
                    </p>
                  )}
                  <MessageBubble message={m} isMe={m.sender_id === user?.id} />
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-card border-t border-border p-3">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={canSend ? "Message the project team..." : "Messaging restricted"}
                className="h-10 text-xs"
                disabled={!canSend || penaltyLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendGroupMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendGroupMessage}
                size="sm"
                className="h-10 px-4 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                disabled={!newMessage.trim() || broadcastMessage.isPending || !canSend}
              >
                {broadcastMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (selectedConvoId && selectedConversation) {
      return (
        <div className="flex-1 flex flex-col bg-background h-full">
          {/* DM Header */}
          <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => { setSelectedConvoId(null); setShowPinned(false); }}
              className="lg:hidden h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <Avatar className="h-9 w-9">
              <AvatarImage src={selectedConversation.participantAvatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {selectedConversation.participantName[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-foreground truncate">
                {selectedConversation.skill} – Team
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                {selectedConversation.participantName} • {selectedConversation.status}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowPinned(!showPinned)}
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors relative ${
                  showPinned ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
                }`}
                title="Pinned messages"
              >
                <Pin className="h-4 w-4" />
                {pinnedMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-bold">
                    {pinnedMessages.length}
                  </span>
                )}
              </button>

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
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Project status banner */}
          {isArchivedChat ? (
            <div className="bg-muted px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground border-b border-border">
              <Lock className="h-3.5 w-3.5" />
              <span>Project completed – Chat archived (read-only)</span>
            </div>
          ) : selectedConversation.status === "accepted" || selectedConversation.status === "ongoing" ? (
            <div className="bg-primary/[0.04] border-b border-primary/10 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-primary font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Active collaboration workspace</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] font-semibold border-primary/30 text-primary"
                onClick={() => navigate(`/collaboration/${selectedConvoId}`)}
              >
                Open Workspace &rarr;
              </Button>
            </div>
          ) : null}

          {/* Pinned messages panel */}
          {showPinned && (
            <div className="bg-card border-b border-border">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Pin className="h-3.5 w-3.5 text-primary" />
                  Pinned Messages ({pinnedMessages.length})
                </span>
                <button onClick={() => setShowPinned(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="px-4 pb-3 space-y-1.5 max-h-36 overflow-y-auto">
                {pinnedMessages.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">No pinned messages yet.</p>
                ) : (
                  pinnedMessages.map((pin) => (
                    <div key={pin.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                      <Pin className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-primary/80 text-[11px]">Pinned Message</p>
                        <p className="text-foreground truncate">{pin.message_id}</p>
                      </div>
                      {!isArchivedChat && (
                        <button
                          onClick={() => pin.message_id && handlePinToggle(pin.message_id)}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        >
                          <PinOff className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages Feed */}
          {!canSend && penalty && penalty.penalty_type !== "warning" && !isArchivedChat ? (
            <ChatRestricted reason="Your messaging is restricted due to policy violations." />
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-xs">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="group relative">
                    <MessageBubble message={message} isMe={message.sender_id === user?.id} />
                    {!isArchivedChat && (
                      <button
                        onClick={() => handlePinToggle(message.id)}
                        className={`absolute top-1 ${message.sender_id === user?.id ? "left-1" : "right-1"} opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-full flex items-center justify-center ${
                          pinnedMessageIds.has(message.id) ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-primary"
                        }`}
                      >
                        {pinnedMessageIds.has(message.id) ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                ))
              )}
              {!isArchivedChat && (
                <TypingIndicator isTyping={isPartnerTyping} name={selectedConversation.participantName.split(" ")[0]} />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Box */}
          {!isArchivedChat ? (
            <div className="bg-card border-t border-border p-3">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder={canSend ? "Message teammate..." : "Messaging restricted"}
                  className="h-10 text-xs"
                  disabled={!canSend || penaltyLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  onBlur={stopTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  className="h-10 px-4 bg-primary text-primary-foreground hover:opacity-90"
                  disabled={!newMessage.trim() || sendMessage.isPending || !canSend}
                >
                  {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 border-t border-border p-3 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                This chat is archived – read only
              </p>
            </div>
          )}
        </div>
      );
    }

    // No selection placeholder (for desktop split view)
    return (
      <div className="flex-1 hidden lg:flex flex-col items-center justify-center p-8 bg-muted/20 text-center border-l border-border">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-3 text-muted-foreground">
          <MessageCircle className="h-8 w-8" />
        </div>
        <h3 className="font-bold text-foreground text-base">Select a conversation</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Choose a project group or direct message from the sidebar to view the team workspace and live chat.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0 flex flex-col lg:flex-row h-screen overflow-hidden">
      
      {/* Left Column: Conversations Sidebar */}
      <div className={`w-full lg:w-96 flex-shrink-0 flex flex-col border-r border-border bg-card h-full ${
        (selectedConvoId || selectedGroupSig) ? "hidden lg:flex" : "flex"
      }`}>
        <div className="px-5 pt-6 pb-4 border-b border-border/80">
          <h1 className="text-xl font-bold text-foreground">Messages & Teams</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time student project discussions</p>
        </div>

        <Tabs defaultValue={groups.length > 0 ? "groups" : "active"} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-3">
            <TabsList className="grid w-full grid-cols-3 h-9 bg-muted">
              <TabsTrigger value="groups" className="text-xs font-semibold gap-1">
                <span>Groups</span>
                {groups.length > 0 && <span className="text-[10px] bg-primary/20 text-primary px-1 rounded">{groups.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs font-semibold gap-1">
                <span>DMs</span>
                {activeConversations.length > 0 && <span className="text-[10px] bg-primary/20 text-primary px-1 rounded">{activeConversations.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="archived" className="text-xs font-semibold gap-1">
                <span>Archived</span>
                {archivedConversations.length > 0 && <span className="text-[10px] bg-muted-foreground/20 px-1 rounded">{archivedConversations.length}</span>}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <TabsContent value="groups" className="space-y-2 mt-0">
              {groups.length > 0 ? (
                groups.map((g) => (
                  <GroupCard
                    key={g.signature}
                    group={g}
                    unread={unreadCounts[g.signature] || 0}
                    onSelect={(sig) => { setSelectedConvoId(null); setSelectedGroupSig(sig); }}
                    isSelected={selectedGroupSig === g.signature}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-medium">No team groups formed</p>
                  <p className="text-[11px] mt-1 px-4">Group chats auto-create when multiple peers join the exact same collaboration request.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-2 mt-0">
              {activeConversations.length > 0 ? (
                activeConversations.map((convo) => (
                  <ConversationCard
                    key={convo.id}
                    convo={convo}
                    onSelect={(id) => { setSelectedGroupSig(null); setSelectedConvoId(id); }}
                    isSelected={selectedConvoId === convo.id}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-medium">No direct messages</p>
                  <p className="text-[11px] mt-1">Accept a peer's project invite to open a 1:1 workspace.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="archived" className="space-y-2 mt-0">
              {archivedConversations.length > 0 ? (
                archivedConversations.map((convo) => (
                  <ConversationCard
                    key={convo.id}
                    convo={convo}
                    onSelect={(id) => { setSelectedGroupSig(null); setSelectedConvoId(id); }}
                    isSelected={selectedConvoId === convo.id}
                    isArchived
                  />
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Archive className="h-8 w-8 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-medium">No completed project archives</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Right Column / Mobile Full Screen: Chat Area */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${
        (!selectedConvoId && !selectedGroupSig) ? "hidden lg:flex" : "flex"
      }`}>
        {renderChatArea()}
      </div>

    </div>
  );
}

function GroupCard({
  group,
  unread,
  onSelect,
  isSelected,
}: {
  group: ProjectGroup;
  unread: number;
  onSelect: (sig: string) => void;
  isSelected?: boolean;
}) {
  const hasUnread = unread > 0;
  return (
    <button
      onClick={() => onSelect(group.signature)}
      className={`w-full rounded-xl p-3 border text-left flex items-center gap-3 transition-all ${
        isSelected ? "bg-primary/[0.08] border-primary shadow-xs" :
        hasUnread ? "border-primary/50 bg-primary/[0.03]" : "border-border/80 bg-background hover:border-border"
      }`}
    >
      <div className="relative h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Users className="h-5 w-5 text-primary" />
        <span className="absolute -bottom-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
          {group.members.length + 1}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h3 className="font-semibold text-xs text-foreground truncate">{group.skill} – Team</h3>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{group.lastMessageTime}</span>
        </div>
        <p className="text-[11px] text-primary/90 font-medium mb-0.5 truncate">
          {group.members.map((m) => m.name).join(", ")}
        </p>
        <p className={`text-xs truncate ${hasUnread ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
          {group.lastMessage || "No messages sent yet"}
        </p>
      </div>
    </button>
  );
}

function ConversationCard({
  convo,
  onSelect,
  isSelected,
  isArchived = false,
}: {
  convo: {
    id: string;
    participantName: string;
    participantAvatar?: string | null;
    unread: number;
    skill: string;
    lastMessageTime: string;
    lastMessage?: string;
  };
  onSelect: (id: string) => void;
  isSelected?: boolean;
  isArchived?: boolean;
}) {
  const initials = convo.participantName[0]?.toUpperCase() || "?";
  return (
    <button
      onClick={() => onSelect(convo.id)}
      className={`w-full rounded-xl p-3 border text-left flex items-center gap-3 transition-all ${
        isSelected ? "bg-primary/[0.08] border-primary shadow-xs" :
        isArchived ? "border-border/50 bg-muted/20 opacity-80" : "border-border/80 bg-background hover:border-border"
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarImage src={convo.participantAvatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!isArchived && convo.unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
            {convo.unread}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h3 className="font-semibold text-xs text-foreground truncate">{convo.skill}</h3>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{convo.lastMessageTime}</span>
        </div>
        <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">
          with {convo.participantName}
        </p>
        <p className={`text-xs truncate ${!isArchived && convo.unread > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
          {convo.lastMessage || "Tap to chat"}
        </p>
      </div>
    </button>
  );
}

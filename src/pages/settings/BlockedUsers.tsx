import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Ban, UserX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function BlockedUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const { blockedUsers, isLoading, unblockUser } = useBlockedUsers();

  const filteredUsers = blockedUsers.filter((user) =>
    (user.profile?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUnblock = async (blockedId: string, userName: string) => {
    try {
      await unblockUser.mutateAsync(blockedId);
      toast({
        title: "User unblocked",
        description: `${userName} has been unblocked.`,
      });
    } catch {
      toast({
        title: "Failed to unblock",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Blocked Users</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search blocked users..."
            className="pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Blocked Users List */}
        {isLoading ? (
          <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <UserX className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? "No results found" : "No blocked users"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? "Try a different search term"
                : "Users you block will appear here"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            {filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 ${
                  index !== filteredUsers.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {(user.profile?.full_name || "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{user.profile?.full_name || "Unknown User"}</p>
                    <p className="text-xs text-muted-foreground">
                      Blocked on {format(new Date(user.blocked_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(user.blocked_id, user.profile?.full_name || "User")}
                  disabled={unblockUser.isPending}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-muted/50 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <Ban className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground text-sm">About Blocking</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Blocked users can't send you messages, view your profile, or send collaboration requests.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
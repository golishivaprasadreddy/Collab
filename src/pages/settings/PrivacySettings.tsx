import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, Shield, MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function PrivacySettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, isLoading, updateSettings } = usePrivacySettings();

  const handleUpdate = async (key: string, value: string | boolean) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
      toast({
        title: "Settings updated",
        description: "Your privacy settings have been saved.",
      });
    } catch {
      toast({
        title: "Failed to save",
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
          <h1 className="text-xl font-semibold text-foreground">Privacy Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Visibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Profile Visibility</h3>
              <p className="text-xs text-muted-foreground">Who can see your profile</p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={settings?.profile_visibility || "everyone"}
              onValueChange={(value) => handleUpdate("profile_visibility", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="connections">Connections Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          )}
        </motion.div>

        {/* Show/Hide Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium text-foreground">Information Visibility</h3>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Label htmlFor="show-email" className="flex flex-col cursor-pointer">
                  <span className="text-foreground">Show Email</span>
                  <span className="text-xs text-muted-foreground font-normal">Display email on profile</span>
                </Label>
                <Switch
                  id="show-email"
                  checked={settings?.show_email || false}
                  onCheckedChange={(checked) => handleUpdate("show_email", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border-b border-border">
                <Label htmlFor="show-college" className="flex flex-col cursor-pointer">
                  <span className="text-foreground">Show College</span>
                  <span className="text-xs text-muted-foreground font-normal">Display college info</span>
                </Label>
                <Switch
                  id="show-college"
                  checked={settings?.show_college ?? true}
                  onCheckedChange={(checked) => handleUpdate("show_college", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <Label htmlFor="show-earnings" className="flex flex-col cursor-pointer">
                  <span className="text-foreground">Show Earnings</span>
                  <span className="text-xs text-muted-foreground font-normal">Display earnings publicly</span>
                </Label>
                <Switch
                  id="show-earnings"
                  checked={settings?.show_earnings || false}
                  onCheckedChange={(checked) => handleUpdate("show_earnings", checked)}
                />
              </div>
            </>
          )}
        </motion.div>

        {/* Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Messages</h3>
              <p className="text-xs text-muted-foreground">Who can message you</p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={settings?.allow_messages_from || "everyone"}
              onValueChange={(value) => handleUpdate("allow_messages_from", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select who can message" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="connections">Connections Only</SelectItem>
                <SelectItem value="nobody">Nobody</SelectItem>
              </SelectContent>
            </Select>
          )}
        </motion.div>
      </div>
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, IndianRupee, TrendingUp, Wallet, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function EarningsPayouts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);

  // Fetch completed paid collaborations as payout history
  const { data: payoutHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["payout-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("collaboration_requests")
        .select("id, agreed_amount, updated_at, skill_needed")
        .or(`requester_id.eq.${user.id},requestee_id.eq.${user.id}`)
        .eq("collaboration_type", "paid")
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = profileLoading || historyLoading;
  const totalEarnings = profile?.reputation?.total_earnings || 0;

  const handleRequestPayout = () => {
    toast({
      title: "Payout requested",
      description: "Your payout will be processed within 3-5 business days.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <h1 className="text-xl font-semibold text-foreground">Earnings & Payouts</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <IndianRupee className="h-4 w-4" />
              <span className="text-xs">Total Earnings</span>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{totalEarnings.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Paid Collabs</span>
            </div>
            <p className="text-2xl font-bold text-success">{payoutHistory.length}</p>
          </motion.div>
        </div>

        {/* Payout History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Completed Paid Collaborations</h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {payoutHistory.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No paid collaborations yet</p>
              </div>
            ) : (
              payoutHistory.map((payout, index) => (
                <div
                  key={payout.id}
                  className={`flex items-center justify-between p-4 ${
                    index !== payoutHistory.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {payout.skill_needed}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payout.updated_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-success">
                    ₹{(payout.agreed_amount || 0).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
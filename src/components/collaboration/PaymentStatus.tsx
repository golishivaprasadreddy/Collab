import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Lock, IndianRupee, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentRequiredProps {
  amount: number;
  collaborationId: string;
}

export function PaymentRequired({ amount, collaborationId }: PaymentRequiredProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const platformFee = Math.ceil(amount * 0.10);
  const totalAmount = amount + platformFee;

  const handleProceedToPayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-collaboration-payment", {
        body: { collaboration_id: collaborationId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initiate payment";
      toast({
        title: "Payment Error",
        description: message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="bg-primary/10 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Payment Required</span>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="text-center py-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            Payment is required to unlock workspace features and start the collaboration.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Agreed Amount</span>
            <span className="font-medium flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {amount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform Fee (10%)</span>
            <span className="font-medium flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {platformFee.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-primary flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />
              {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <p className="text-xs text-foreground">
              You'll be redirected to Stripe's secure checkout to complete your payment.
            </p>
          </div>
        </div>

        <Button
          onClick={handleProceedToPayment}
          disabled={loading}
          className="w-full h-12 gradient-primary border-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Proceed to Payment
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Powered by Stripe. Your payment details are secure.
        </p>
      </div>
    </motion.div>
  );
}

interface PaymentPendingProps {
  message?: string;
}

export function PaymentPending({ message }: PaymentPendingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">Payment Pending</p>
          <p className="text-sm text-muted-foreground">
            {message || "Waiting for payment confirmation to unlock features."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface PaymentConfirmedProps {
  amount: number;
}

export function PaymentConfirmed({ amount }: PaymentConfirmedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-success/10 border border-success/30 rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-success" />
        </div>
        <div>
          <p className="font-semibold text-success text-sm">Payment Confirmed</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <IndianRupee className="h-3 w-3" />
            {amount.toLocaleString()} received
          </p>
        </div>
      </div>
    </motion.div>
  );
}

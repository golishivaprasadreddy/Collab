import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");

  const collaborationId = searchParams.get("collaboration_id");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !collaborationId) {
        setStatus("failed");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-collaboration-payment", {
          body: { session_id: sessionId, collaboration_id: collaborationId },
        });

        if (error) throw error;

        if (data?.verified) {
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [sessionId, collaborationId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full text-center shadow-card"
      >
        {status === "verifying" && (
          <>
            <div className="h-20 w-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-6">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Verifying Payment</h1>
            <p className="text-muted-foreground text-sm">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="h-20 w-20 rounded-full bg-success/10 mx-auto flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="h-10 w-10 text-success" />
            </motion.div>
            <h1 className="text-xl font-bold text-foreground mb-2">Payment Successful! 🎉</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Your payment has been confirmed. The workspace is now unlocked!
            </p>
            <Button
              onClick={() => navigate(`/collaboration/${collaborationId}`)}
              className="w-full gradient-primary border-0"
            >
              Go to Workspace
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="h-20 w-20 rounded-full bg-destructive/10 mx-auto flex items-center justify-center mb-6">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Verification Failed</h1>
            <p className="text-muted-foreground text-sm mb-6">
              We couldn't verify your payment. If you were charged, please contact support.
            </p>
            <div className="space-y-3">
              {collaborationId && (
                <Button
                  onClick={() => navigate(`/collaboration/${collaborationId}`)}
                  className="w-full gradient-primary border-0"
                >
                  Back to Collaboration
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/home")} className="w-full">
                Go Home
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

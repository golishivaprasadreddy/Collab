import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Plus, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function PaymentInfo() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAddPayment = () => {
    toast({
      title: "Opening website",
      description: "Payment methods are managed via the Collabio website.",
    });
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
          <h1 className="text-xl font-semibold text-foreground">Payment Info</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No payment methods</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Add a payment method to pay for paid collaborations securely.
          </p>
          <Button onClick={handleAddPayment} className="gradient-primary border-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-success mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground">Secure Payments</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your payment information is encrypted and securely stored. We never share your details with collaborators.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

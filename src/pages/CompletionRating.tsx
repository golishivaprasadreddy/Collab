import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Star,
  CheckCircle2,
  Trophy,
  IndianRupee,
} from "lucide-react";
import { useActiveCollaborations, useCreateRating } from "@/hooks/useCollaborations";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function CompletionRating() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: collaborations } = useActiveCollaborations();
  const createRating = useCreateRating();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Also check completed collaborations
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

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    if (isPaid && !paymentConfirmed) {
      toast({
        title: "Please confirm payment status",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRating.mutateAsync({
        collaboration_request_id: collaboration.id,
        rated_user_id: isRequester ? collaboration.requestee_id : collaboration.requester_id,
        score: rating,
        feedback: feedback.trim() || undefined,
        payment_confirmed: isPaid ? paymentConfirmed : undefined,
      });

      toast({
        title: "Rating submitted! 🎉",
        description: "Thank you for your feedback.",
      });
      navigate("/portfolio");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit rating";
      toast({
        title: "Failed to submit rating",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="gradient-hero px-4 pt-12 pb-16 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <div className="h-20 w-20 mx-auto rounded-full bg-primary-foreground/20 flex items-center justify-center mb-4">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-primary-foreground"
        >
          Collaboration Complete!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-primary-foreground/80 mt-2"
        >
          Rate your experience with {partner?.full_name}
        </motion.p>
      </div>

      <div className="px-4 -mt-8 space-y-6">
        {/* Partner card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl p-6 border border-border shadow-card text-center"
        >
          <Avatar className="h-20 w-20 mx-auto ring-4 ring-card">
            <AvatarImage src={partner?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {partnerInitials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-semibold text-foreground mt-4">
            {partner?.full_name}
          </h2>
          <p className="text-sm text-muted-foreground">{partner?.college}</p>

          {/* Star rating */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "text-warning fill-warning"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {rating === 0
              ? "Tap to rate"
              : rating === 5
              ? "Excellent!"
              : rating === 4
              ? "Great!"
              : rating === 3
              ? "Good"
              : rating === 2
              ? "Fair"
              : "Poor"}
          </p>
        </motion.div>

        {/* Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <h3 className="font-semibold text-foreground mb-3">
            Share your experience (optional)
          </h3>
          <Textarea
            placeholder="How was your collaboration? Share feedback to help others..."
            className="min-h-[100px] resize-none"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </motion.div>

        {/* Payment confirmation for paid collaborations */}
        {isPaid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id="payment"
                checked={paymentConfirmed}
                onCheckedChange={(checked) => setPaymentConfirmed(checked === true)}
              />
              <div className="flex-1">
                <Label
                  htmlFor="payment"
                  className="font-semibold text-foreground cursor-pointer flex items-center gap-2"
                >
                  <IndianRupee className="h-4 w-4 text-success" />
                  Confirm Payment
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I confirm that I have received/made the payment of ₹
                  {collaboration.agreed_amount?.toLocaleString()} for this collaboration.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={handleSubmit}
            className="w-full h-14 text-base gradient-primary border-0"
            disabled={createRating.isPending}
          >
            {createRating.isPending ? (
              "Submitting..."
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Submit Rating
              </>
            )}
          </Button>
        </motion.div>

        {/* Points info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-muted-foreground"
        >
          🎉 You'll earn <span className="font-semibold text-primary">+10 points</span> for completing this collaboration!
        </motion.p>
      </div>
    </div>
  );
}

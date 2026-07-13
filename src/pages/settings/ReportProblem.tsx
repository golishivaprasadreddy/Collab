import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Flag, AlertTriangle, Bug, MessageSquare, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const reportTypes = [
  { id: "bug", label: "Bug or Error", icon: Bug, description: "Something isn't working correctly" },
  { id: "harassment", label: "Harassment", icon: AlertTriangle, description: "Report abusive behavior" },
  { id: "fraud", label: "Fraud or Scam", icon: Shield, description: "Suspicious activity" },
  { id: "feedback", label: "General Feedback", icon: MessageSquare, description: "Share your thoughts" },
];

export default function ReportProblem() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType || !description.trim()) {
      toast({
        title: "Please complete the form",
        description: "Select a report type and describe the issue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSubmitted(true);

    toast({
      title: "Report submitted",
      description: "We'll review your report and take appropriate action.",
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Report Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for helping us keep Collabio safe. We'll review your report and take appropriate action.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </motion.div>
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
          <h1 className="text-xl font-semibold text-foreground">Report a Problem</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Report Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Label className="text-sm text-muted-foreground mb-3 block">What would you like to report?</Label>
          <div className="grid grid-cols-2 gap-3">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 mb-2 ${
                      selectedType === type.id ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <p className="font-medium text-foreground text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Label htmlFor="description" className="text-sm text-muted-foreground mb-3 block">
            Describe the issue
          </Label>
          <Textarea
            id="description"
            placeholder="Please provide as much detail as possible..."
            className="min-h-[150px] resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full gradient-primary border-0"
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

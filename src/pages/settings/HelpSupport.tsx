import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Mail,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const faqs = [
  {
    question: "How do I start a collaboration?",
    answer:
      "Search for users with the skills you need, view their profile, and send a collaboration request. Once they accept, you can start working together in a shared workspace.",
  },
  {
    question: "How do paid collaborations work?",
    answer:
      "For paid collaborations, you agree on a price with your collaborator. Payment is held securely until both parties confirm completion. Then the payment is released to the collaborator.",
  },
  {
    question: "How can I improve my reputation score?",
    answer:
      "Complete collaborations successfully, get positive ratings from your partners, and maintain good communication. The more positive experiences you have, the higher your reputation.",
  },
  {
    question: "What happens if a collaboration goes wrong?",
    answer:
      "If you encounter issues, try to resolve them through messaging first. If that doesn't work, you can report the problem through Settings > Report a Problem and our team will help mediate.",
  },
  {
    question: "How do I get verified?",
    answer:
      "Verification requires completing your profile, adding your college email, and successfully completing at least 3 collaborations with positive ratings.",
  },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSupport = () => {
    toast({
      title: "Opening email",
      description: "Your default email app will open.",
    });
    window.location.href = "mailto:support@collabio.app";
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
          <h1 className="text-xl font-semibold text-foreground">Help & Support</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            className="pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={handleContactSupport}
            className="bg-card rounded-xl border border-border p-4 text-left hover:border-primary/50 transition-colors"
          >
            <Mail className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium text-foreground text-sm">Email Support</p>
            <p className="text-xs text-muted-foreground">Get help via email</p>
          </button>

          <button
            onClick={() => navigate("/report")}
            className="bg-card rounded-xl border border-border p-4 text-left hover:border-primary/50 transition-colors"
          >
            <MessageCircle className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium text-foreground text-sm">Report Issue</p>
            <p className="text-xs text-muted-foreground">Report a problem</p>
          </button>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Frequently Asked Questions
          </h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No results found
              </div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <Collapsible
                  key={index}
                  open={openFaq === index}
                  onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <CollapsibleTrigger
                    className={`flex items-center justify-between p-4 w-full text-left hover:bg-muted/50 transition-colors ${
                      index !== filteredFaqs.length - 1 && openFaq !== index
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-foreground text-sm">
                        {faq.question}
                      </span>
                    </div>
                    {openFaq === index ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    className={`px-4 pb-4 pt-0 ${
                      index !== filteredFaqs.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <p className="text-sm text-muted-foreground pl-8">
                      {faq.answer}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </motion.div>

        {/* Documentation Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Documentation</p>
                <p className="text-xs text-muted-foreground">View full user guide</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

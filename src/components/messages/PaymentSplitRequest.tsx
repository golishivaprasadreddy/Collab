import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IndianRupee, Users, Send, X, SplitSquareVertical } from "lucide-react";

interface PaymentSplitRequestProps {
  onSend: (message: string) => void;
  partnerName: string;
}

export function PaymentSplitRequest({ onSend, partnerName }: PaymentSplitRequestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [eventName, setEventName] = useState("");
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [myShare, setMyShare] = useState("");

  const total = parseFloat(totalAmount) || 0;
  const equalShare = total / 2;
  const partnerShare = splitType === "equal" ? equalShare : total - (parseFloat(myShare) || 0);

  const handleSend = () => {
    if (!total || !eventName) return;
    const shareAmount = splitType === "equal" ? equalShare : partnerShare;
    const message = `💳 Payment Split Request\n━━━━━━━━━━━━━━━━\n📌 Event: ${eventName}\n💰 Total: ₹${total}\n👤 Your share: ₹${shareAmount.toFixed(0)}\n━━━━━━━━━━━━━━━━\nPlease pay your share to register together!`;
    onSend(message);
    setIsOpen(false);
    setTotalAmount("");
    setEventName("");
    setMyShare("");
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="h-10 w-10 rounded-xl flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
        title="Split Payment"
      >
        <SplitSquareVertical className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-card rounded-t-3xl w-full max-w-lg p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  Split Event Payment
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Event Name</Label>
                  <Input
                    placeholder="e.g. TechFest Hackathon"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div>
                  <Label className="text-xs">Total Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter total registration fee"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={splitType === "equal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSplitType("equal")}
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Equal Split
                  </Button>
                  <Button
                    variant={splitType === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSplitType("custom")}
                    className="flex-1"
                  >
                    Custom Split
                  </Button>
                </div>

                {splitType === "custom" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                    <Label className="text-xs">Your Share (₹)</Label>
                    <Input
                      type="number"
                      placeholder="Enter your share"
                      value={myShare}
                      onChange={(e) => setMyShare(e.target.value)}
                      className="h-11"
                    />
                  </motion.div>
                )}

                {total > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/50 rounded-xl p-3 space-y-1"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">You pay</span>
                      <span className="font-semibold text-foreground">
                        ₹{splitType === "equal" ? equalShare.toFixed(0) : (parseFloat(myShare) || 0).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{partnerName} pays</span>
                      <span className="font-semibold text-foreground">
                        ₹{partnerShare.toFixed(0)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              <Button
                onClick={handleSend}
                disabled={!total || !eventName}
                className="w-full h-12 gradient-primary border-0"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Split Request
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { WifiOff } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineBanner() {
  const { isOnline } = usePWA();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <WifiOff className="h-4 w-4" />
          You're offline. Some features may be limited.
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FullScreenAvatarProps {
  src?: string | null;
  fallback: string;
  className?: string;
  children?: React.ReactNode;
}

export function FullScreenAvatar({ src, fallback, className, children }: FullScreenAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => src && setIsOpen(true)} className={`cursor-pointer ${className || ""}`}>
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white z-10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </motion.button>

            <motion.img
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              src={src || ""}
              alt="Profile"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

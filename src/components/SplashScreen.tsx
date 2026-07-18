import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    // Ensure the splash screen stays on for 3.8 seconds before hiding
    const timer = setTimeout(() => {
      onComplete();
    }, 3800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[999999] bg-background flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="flex items-center justify-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
          className="z-20 relative flex items-center justify-center"
        >
          {/* Custom Bolt SVG matching the user's screenshot */}
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary drop-shadow-[0_0_15px_rgba(0,229,153,0.4)]"
          >
            <path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              fill="#00E599"
              stroke="#00E599"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        {/* Text Container */}
        <motion.div
          initial={{ width: 0, opacity: 0, marginLeft: 0 }}
          animate={{ width: "auto", opacity: 1, marginLeft: "12px" }}
          transition={{ delay: 1.2, duration: 1.0, type: "spring", bounce: 0.1 }}
          className="overflow-hidden whitespace-nowrap z-10 flex items-center py-2"
        >
          <span className="text-4xl md:text-5xl font-black font-display tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 pb-1">
            SPORTSBUZZ
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

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
      className="fixed inset-0 z-[999999] bg-[#0a0a0c] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a2332] via-[#0a0a0c] to-[#0a0a0c] flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Animated Wrapper that shifts left to keep things centered as text appears */}
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: -110 }}
          transition={{ delay: 1.0, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center z-20"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 flex items-center justify-center rounded-full"
          >
            {/* Custom Bolt SVG matching the user's screenshot */}
            <svg
              width="84"
              height="84"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#00E599]"
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

          {/* Text sliding out from behind the logo */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-full ml-5 z-10 whitespace-nowrap"
          >
            <span className="text-[44px] md:text-[52px] font-black font-display tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-[#00E599] to-[#3b82f6]">
              SPORTSBUZZ
            </span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

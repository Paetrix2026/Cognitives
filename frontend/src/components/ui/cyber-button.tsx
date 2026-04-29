import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

interface CyberButtonProps {
  text?: string;
  onClick?: () => void;
  className?: string;
}

export const CyberButton: React.FC<CyberButtonProps> = ({
  text = "START BUILDING",
  onClick,
  className = "",
}) => {
  const [displayText, setDisplayText] = useState(text);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Mouse-Tracking Spotlight Logic
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    buttonRef.current.style.setProperty("--mouse-x", `${x}px`);
    buttonRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  // 2. Hacker/Text Scramble Logic
  const scrambleText = () => {
    let iteration = 0;
    clearInterval(intervalRef.current as NodeJS.Timeout);

    intervalRef.current = setInterval(() => {
      setDisplayText((prev) =>
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return LETTERS[Math.floor(Math.random() * LETTERS.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(intervalRef.current as NodeJS.Timeout);
      }

      // Lower number = slower decode. 1/3 decodes 1 character every 3 ticks (~90ms)
      // Total animation time ≈ 500ms for a ~15 char string
      iteration += 1 / 3;
    }, 30);
  };

  const handleMouseEnter = () => {
    scrambleText();
  };

  const handleMouseLeave = () => {
    clearInterval(intervalRef.current as NodeJS.Timeout);
    setDisplayText(text); // Reset immediately on leave
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // 3. Framer Motion Spring Dynamics
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative overflow-hidden rounded-xl bg-black/40 px-8 py-4 font-mono font-bold tracking-[0.2em] text-white backdrop-blur-md group ${className}`}
      style={
        {
          // Fallback coordinates in case mouse hasn't entered yet
          "--mouse-x": "50%",
          "--mouse-y": "50%",
        } as React.CSSProperties
      }
    >
      {/* --- Glassmorphism Base Border --- */}
      <div className="absolute inset-0 rounded-xl border border-white/10 transition-colors duration-300 group-hover:border-transparent" />

      {/* --- Effect 1a: Internal Spotlight Fill --- */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(120px circle at var(--mouse-x) var(--mouse-y), rgba(139, 92, 246, 0.15), transparent 40%)`,
        }}
      />

      {/* --- Effect 1b: Intense Spotlight Border --- */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          padding: "1px",
          background: `radial-gradient(80px circle at var(--mouse-x) var(--mouse-y), rgba(167, 139, 250, 0.8), transparent 40%)`,
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
        {displayText}
      </span>
    </motion.button>
  );
};

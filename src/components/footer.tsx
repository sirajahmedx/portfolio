"use client";

import { motion } from "framer-motion";

interface Footer {
  variant?: "bottom" | "center";
  className?: string;
}

export default function Footer({ variant = "bottom", className = "" }: Footer) {
  const baseClasses = "text-xs text-muted-foreground/60";

  const variantClasses = {
    bottom: "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10",
    center: "flex justify-center items-center py-6",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: variant === "bottom" ? 20 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      Inspired by{" "}
      <a
        href="https://toukam.fr"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-1 hover:text-primary transition-colors duration-200 underline decoration-dotted underline-offset-2"
      >
        Toukam
      </a>
    </motion.div>
  );
}

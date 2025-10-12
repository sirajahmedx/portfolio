"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

interface StyleSelectorProps {
  selectedStyle: "polite" | "concise" | "versatile" | "creative";
  onStyleChange: (
    style: "polite" | "concise" | "versatile" | "creative"
  ) => void;
  disabled?: boolean;
}

const STYLE_OPTIONS = [
  {
    id: "polite" as const,
    label: "Polite",
    description: "Friendly & conversational",
    color: "text-blue-500",
  },
  {
    id: "concise" as const,
    label: "Concise",
    description: "Direct & to the point",
    color: "text-green-500",
  },
  {
    id: "versatile" as const,
    label: "Versatile",
    description: "Balanced & detailed",
    color: "text-purple-500",
  },
  {
    id: "creative" as const,
    label: "Creative",
    description: "Fun & imaginative",
    color: "text-orange-500",
  },
];

export default function StyleSelector({
  selectedStyle,
  onStyleChange,
  disabled = false,
}: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = STYLE_OPTIONS.find(
    (option) => option.id === selectedStyle
  );

  return (
    <div className="relative inline-block">
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mb-1
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          bg-transparent hover:bg-card/30 border border-transparent hover:border-border/20
          ${isOpen ? "bg-card/30 border-border/20" : ""}
        `}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-xs font-semibold">{selectedOption?.label}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-0" : "rotate-180"}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-full mb-2 right-0 z-50 w-48 bg-card/95 backdrop-blur-xl border border-border/20 rounded-lg shadow-xl overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-border/10">
                <p className="text-xs text-red-500 font-medium">Experimental</p>
              </div>
              {STYLE_OPTIONS.map((option) => {
                const isSelected = selectedStyle === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onStyleChange(option.id);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 text-left text-sm
                      transition-colors duration-150 hover:bg-muted/30
                      ${isSelected ? "bg-primary/8 text-primary" : "text-foreground"}
                    `}
                  >
                    <span className="font-medium">{option.label}</span>
                    {isSelected && (
                      <div className="w-2 h-2 bg-primary rounded-full ml-auto" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

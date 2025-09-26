"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Zap, Users, Sparkles } from "lucide-react";
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
    icon: MessageCircle,
    color: "text-blue-500",
  },
  {
    id: "concise" as const,
    label: "Concise",
    description: "Direct & to the point",
    icon: Zap,
    color: "text-green-500",
  },
  {
    id: "versatile" as const,
    label: "Versatile",
    description: "Balanced & detailed",
    icon: Users,
    color: "text-purple-500",
  },
  {
    id: "creative" as const,
    label: "Creative",
    description: "Fun & imaginative",
    icon: Sparkles,
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
  const Icon = selectedOption?.icon || MessageCircle;

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          bg-card/50 border border-border/30 hover:bg-card hover:border-border/50
          ${isOpen ? "ring-1 ring-primary/20" : ""}
        `}
        whileTap={{ scale: 0.98 }}
      >
        <Icon className={`h-3.5 w-3.5 ${selectedOption?.color}`} />
        <span className="hidden sm:inline">{selectedOption?.label}</span>
        <span className="sm:hidden">{selectedOption?.label.charAt(0)}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-0" : "rotate-180"}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 right-0 z-50 w-48 bg-card border border-border/30 rounded-lg shadow-lg overflow-hidden"
            >
              {STYLE_OPTIONS.map((option) => {
                const OptionIcon = option.icon;
                const isSelected = selectedStyle === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      onStyleChange(option.id);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm
                      transition-colors duration-150 hover:bg-muted/50
                      ${isSelected ? "bg-primary/5 text-primary border-l-2 border-primary" : "text-foreground"}
                    `}
                  >
                    <OptionIcon className={`h-4 w-4 ${option.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs">{option.label}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {option.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
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

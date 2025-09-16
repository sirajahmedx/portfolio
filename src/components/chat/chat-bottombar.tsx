// src/components/chat/chat-bottombar.tsx
"use client";

import { ChatRequestOptions } from "ai";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUp, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { FastfolioTracking } from "@/lib/fastfolio-tracking";

interface ChatBottombarProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  isLoading: boolean;
  stop: () => void;
  input: string;
  isToolInProgress: boolean;
  disabled?: boolean;
}

export default function ChatBottombar({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  isToolInProgress,
  disabled = false,
}: ChatBottombarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [remainingMessages, setRemainingMessages] = useState(0);

  useEffect(() => {
    // Update remaining messages count
    setRemainingMessages(FastfolioTracking.getRemainingMessages());
  }, [input]); // Update when input changes (user is typing)

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      !e.nativeEvent.isComposing &&
      !isToolInProgress &&
      input.trim()
    ) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative group">
          <div className="border-border/60 bg-card/80 backdrop-blur-xl mx-auto flex items-center rounded-2xl border shadow-lg py-3 pr-3 pl-4 md:pl-7 transition-all duration-300 group-hover:border-border group-hover:shadow-xl">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={
                disabled
                  ? "Chat limit reached"
                  : isToolInProgress
                    ? "Tool is in progress..."
                    : "Ask me anything..."
              }
              className={`text-sm md:text-base placeholder:text-muted-foreground/70 w-full border-none bg-transparent focus:outline-none transition-colors duration-200 ${
                disabled ? "font-medium text-destructive" : "text-foreground"
              }`}
              disabled={isToolInProgress || isLoading || disabled}
            />

            <button
              type="submit"
              disabled={
                isLoading || !input.trim() || isToolInProgress || disabled
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center rounded-xl p-2 md:p-2.5 transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
              onClick={(e) => {
                if (isLoading) {
                  e.preventDefault();
                  stop();
                }
              }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </button>
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10" />
        </div>
      </form>
    </motion.div>
  );
}

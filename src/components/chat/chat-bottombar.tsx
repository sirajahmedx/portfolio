"use client";

import { ChatRequestOptions } from "ai";
import { motion } from "framer-motion";
import { ArrowUp, Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import StyleSelector from "./style-selector";

interface ChatBottombarProps {
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  isLoading: boolean;
  stop: () => void;
  input: string;
  isToolInProgress: boolean;
  disabled?: boolean;
  selectedStyle: "polite" | "concise" | "versatile" | "creative";
  onStyleChange: (
    style: "polite" | "concise" | "versatile" | "creative"
  ) => void;
}

export default function ChatBottombar({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  isToolInProgress,
  disabled = false,
  selectedStyle,
  onStyleChange,
}: ChatBottombarProps) {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
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
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 80)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex-shrink-0"
    >
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative group">
          <div className="border-border/60 backdrop-blur-xl mx-auto flex items-end rounded-2xl border shadow-lg py-6 pr-2 pl-3 md:pl-4 transition-all duration-300 group-hover:border-border group-hover:shadow-xl">
            <textarea
              ref={inputRef}
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
              className={`text-sm placeholder:text-muted-foreground/70 w-full border-none bg-transparent focus:outline-none transition-colors duration-200 resize-none leading-relaxed ${
                disabled ? "font-medium text-destructive" : "text-foreground"
              }`}
              disabled={isToolInProgress || isLoading || disabled}
              rows={1}
              style={{ minHeight: "2rem", maxHeight: "5rem" }}
            />

            <div className="flex items-center mr-2">
              <StyleSelector
                selectedStyle={selectedStyle}
                onStyleChange={onStyleChange}
                disabled={disabled}
              />
            </div>

            <button
              type="submit"
              disabled={
                isLoading || !input.trim() || isToolInProgress || disabled
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center rounded-lg p-1.5 md:p-2 transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
              onClick={(e) => {
                if (isLoading) {
                  e.preventDefault();
                  stop();
                }
              }}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
              )}
            </button>
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10" />
        </div>
      </form>
    </motion.div>
  );
}

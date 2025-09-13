"use client";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

// Component imports
import ChatBottombar from "@/components/chat/chat-bottombar";
import ChatLanding from "@/components/chat/chat-landing";
import ChatMessageContent from "@/components/chat/chat-message-content";
import { SimplifiedChatView } from "@/components/chat/simple-chat-view";
import {
  ChatBubble,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import WelcomeModal from "@/components/welcome-modal";
import { Info } from "lucide-react";
import HelperBoost from "./HelperBoost";

// Message info dialog component
const MessageInfoDialog = ({
  message,
  isOpen,
  onClose,
}: {
  message: Message;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="from-background to-background/95 border-border/50 mx-4 max-w-sm rounded-2xl border bg-gradient-to-br p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-foreground text-base font-semibold">
            Message Info
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-full p-1 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="space-y-3">
          <div className="border-border/30 flex items-center justify-between border-b py-2">
            <span className="text-muted-foreground text-sm">From</span>
            <span className="text-sm font-medium">
              {message.role === "assistant" ? "Siraj Ahmed" : "You"}
            </span>
          </div>
          <div className="border-border/30 flex items-center justify-between border-b py-2">
            <span className="text-muted-foreground text-sm">Time</span>
            <span className="text-sm font-medium">
              {message.timestamp.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground text-sm">Length</span>
            <span className="text-sm font-medium">
              {message.content.length} characters
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Message type definition
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ClientOnly component for client-side rendering
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
};

// Define Avatar component props interface
interface AvatarProps {
  hasActiveTool: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isTalking: boolean;
}

// Dynamic import of Avatar component
const Avatar = dynamic<AvatarProps>(
  () =>
    Promise.resolve(({ hasActiveTool, videoRef, isTalking }: AvatarProps) => {
      // This function will only execute on the client
      const isIOS = () => {
        // Multiple detection methods
        const userAgent = window.navigator.userAgent;
        const platform = window.navigator.platform;
        const maxTouchPoints = window.navigator.maxTouchPoints || 0;

        // UserAgent-based check
        const isIOSByUA =
          //@ts-ignore
          /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

        // Platform-based check
        const isIOSByPlatform = /iPad|iPhone|iPod/.test(platform);

        // iPad Pro check
        const isIPadOS =
          //@ts-ignore
          platform === "MacIntel" && maxTouchPoints > 1 && !window.MSStream;

        // Safari check
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

        return isIOSByUA || isIOSByPlatform || isIPadOS || isSafari;
      };

      // Conditional rendering based on detection
      return (
        <div
          className={`flex items-center justify-center rounded-full transition-all duration-300 ${hasActiveTool ? "h-20 w-20" : "h-28 w-28"}`}
        >
          <div
            className="relative cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
            {isIOS() ? (
              <img
                src="/landing-memojis.png"
                alt="iOS avatar"
                className="h-full w-full scale-[1.8] object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                className="h-full w-full scale-[1.8] object-contain"
                muted
                playsInline
                loop
              >
                <source src="/final_memojis.webm" type="video/webm" />
                <source src="/final_memojis_ios.mp4" type="video/mp4" />
              </video>
            )}
          </div>
        </div>
      );
    }),
  { ssr: false }
);

const MOTION_CONFIG = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4 },
};

const Chat = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);

  // Ref to store current messages for submitQuery
  const messagesRef = useRef<Message[]>([]);

  // Update ref when messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Generate unique ID for messages
  const generateId = useCallback(
    () => Math.random().toString(36).substring(7),
    []
  );

  // Load conversation from local storage
  const loadConversation = useCallback(() => {
    try {
      const saved = localStorage.getItem("chat-conversation");
      if (saved) {
        const parsedMessages = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }, []);

  // Save conversation to local storage
  const saveConversation = useCallback((messages: Message[]) => {
    try {
      localStorage.setItem("chat-conversation", JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save conversation:", error);
    }
  }, []);

  // Enhanced auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, []);

  // Auto-scroll when messages change or loading state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100); // Small delay to ensure DOM updates

    return () => clearTimeout(timer);
  }, [messages, loadingSubmit, scrollToBottom]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    localStorage.removeItem("chat-conversation");
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    []
  );

  // Submit query to API
  const submitQuery = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading || loadingSubmit) {
        console.log(
          "[CLIENT] Submit blocked - query:",
          query.trim(),
          "isLoading:",
          isLoading,
          "loadingSubmit:",
          loadingSubmit
        );
        return;
      }

      // Rate limiting: prevent requests more frequent than every 2 seconds
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < 2000) {
        console.log("[CLIENT] Rate limited - too frequent requests");
        toast.error("Please wait a moment before sending another message.");
        return;
      }

      const trimmedQuery = query.trim();
      console.log("[CLIENT] Starting submitQuery with:", trimmedQuery);

      setLastRequestTime(now);

      // Add user message immediately
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: trimmedQuery,
        timestamp: new Date(),
      };

      console.log("[CLIENT] Adding user message:", userMessage.id);

      setMessages((prev) => {
        const newMessages = [...prev, userMessage];
        console.log("[CLIENT] Messages after adding user:", newMessages.length);
        return newMessages;
      });

      setInput(""); // Clear input after adding message
      setIsLoading(true);
      setLoadingSubmit(true);
      setIsTalking(true);

      // Get current messages for API call (using ref to avoid dependency)
      const currentMessages = [...messagesRef.current, userMessage];
      console.log(
        "[CLIENT] Sending to API - message count:",
        currentMessages.length
      );

      // Play video
      if (videoRef.current) {
        videoRef.current.play().catch((error) => {
          console.error("Failed to play video:", error);
        });
      }

      try {
        console.log("[CLIENT] Making API request...");
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: currentMessages,
          }),
        });

        console.log("[CLIENT] API response status:", response.status);

        if (!response.ok) {
          if (response.status === 429) {
            const errorText = await response.text();
            throw new Error(
              errorText || "API quota exceeded. Please try again later."
            );
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";
        let chunkCount = 0;

        // Create assistant message placeholder
        const assistantMessageId = generateId();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        console.log(
          "[CLIENT] Adding assistant placeholder:",
          assistantMessageId
        );

        // Add empty assistant message to state
        setMessages((prev) => {
          const newMessages = [...prev, assistantMessage];
          console.log(
            "[CLIENT] Messages after adding assistant placeholder:",
            newMessages.length
          );
          return newMessages;
        });

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log("[CLIENT] Stream done, total chunks:", chunkCount);
                break;
              }

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6).trim();

                  if (data === "[DONE]") {
                    console.log("[CLIENT] Received [DONE] marker");
                    break;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.text && parsed.text.trim()) {
                      assistantContent += parsed.text;
                      chunkCount++;

                      console.log(
                        `[CLIENT] Chunk ${chunkCount}: "${parsed.text}" (total length: ${assistantContent.length})`
                      );

                      // Update the assistant message in real-time
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: assistantContent }
                            : msg
                        )
                      );

                      // Stop loading animation after first chunk
                      if (chunkCount === 1) {
                        console.log(
                          "[CLIENT] First chunk received, stopping loading animation"
                        );
                        setIsLoading(false);
                      }

                      // Auto-scroll to bottom on each chunk
                      setTimeout(() => scrollToBottom(), 50);
                    }
                  } catch (parseError) {
                    console.warn(
                      "[CLIENT] Failed to parse streaming data:",
                      data,
                      parseError
                    );
                  }
                }
              }
            }
          } catch (streamError) {
            console.error("[CLIENT] Streaming error:", streamError);
            // Update with error message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content:
                        "Sorry, there was an error processing your request. Please try again.",
                    }
                  : msg
              )
            );
          } finally {
            reader.releaseLock();
          }
        }

        console.log(
          "[CLIENT] Final assistant content length:",
          assistantContent.length
        );

        // Final update to ensure content is complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: assistantContent }
              : msg
          )
        );

        // Save to localStorage
        setTimeout(() => {
          const finalMessages = [
            ...messagesRef.current,
            userMessage,
            { ...assistantMessage, content: assistantContent },
          ];
          saveConversation(finalMessages);
          console.log("[CLIENT] Saved conversation to localStorage");
        }, 100);
      } catch (error) {
        console.error("[CLIENT] Chat error:", error);

        // Check if it's a quota exceeded error
        const isQuotaError =
          error instanceof Error &&
          (error.message.includes("QUOTA_EXCEEDED") ||
            error.message.includes("quota exceeded") ||
            error.message.includes("429"));

        if (isQuotaError) {
          setHasReachedLimit(true);
        }

        const errorToastMessage = isQuotaError
          ? "Daily API limit reached. Please try again tomorrow."
          : "Failed to get response. Please try again.";

        toast.error(errorToastMessage);

        // Add error message to chat
        const errorMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: isQuotaError
            ? "I've reached my daily conversation limit. Please try again tomorrow or contact me directly for more information."
            : "Sorry, I encountered an error while processing your request. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setLoadingSubmit(false);
        setIsTalking(false);
        if (videoRef.current) {
          videoRef.current.pause();
        }
        console.log("[CLIENT] Request completed");
      }
    },
    [
      isLoading,
      loadingSubmit,
      generateId,
      scrollToBottom,
      saveConversation,
      lastRequestTime,
    ]
  );

  // Handle form submission
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const currentInput = input.trim();
      console.log("[CLIENT] Form submit triggered with input:", currentInput);

      if (!currentInput || isToolInProgress) {
        console.log(
          "[CLIENT] Submit blocked - empty input or tool in progress"
        );
        return;
      }

      if (isLoading || loadingSubmit) {
        console.log("[CLIENT] Submit blocked - already processing");
        return;
      }

      console.log("[CLIENT] Calling submitQuery with:", currentInput);
      submitQuery(currentInput);
    },
    [input, isLoading, loadingSubmit, submitQuery]
  );

  // Stop current request
  const handleStop = useCallback(() => {
    setIsLoading(false);
    setLoadingSubmit(false);
    setIsTalking(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  // Reload last message (simplified)
  const reload = useCallback(async () => {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    if (lastUserMessage) {
      await submitQuery(lastUserMessage.content);
    }
    return null;
  }, [messages, submitQuery]);

  // Add tool result (placeholder)
  const addToolResult = useCallback(() => {
    // Placeholder for tool results
  }, []);

  // Append message (for compatibility)
  const append = useCallback(
    (message: { role: "user" | "assistant"; content: string }) => {
      const newMessage: Message = {
        id: generateId(),
        role: message.role,
        content: message.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    []
  );

  // Computed values
  const { currentAIMessage, latestUserMessage, hasActiveTool } = useMemo(() => {
    const latestAIMessageIndex = messages.findLastIndex(
      (m: Message) => m.role === "assistant"
    );
    const latestUserMessageIndex = messages.findLastIndex(
      (m: Message) => m.role === "user"
    );

    const result = {
      currentAIMessage:
        latestAIMessageIndex !== -1 ? messages[latestAIMessageIndex] : null,
      latestUserMessage:
        latestUserMessageIndex !== -1 ? messages[latestUserMessageIndex] : null,
      hasActiveTool: false,
    };

    if (latestAIMessageIndex < latestUserMessageIndex) {
      result.currentAIMessage = null;
    }

    return result;
  }, [messages]);

  const isToolInProgress = messages.some(
    (m: Message) => m.role === "assistant" && false // Simplified - no tool support for now
  );

  // Effects
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.pause();
    }

    // Load conversation from local storage on mount
    loadConversation();

    if (initialQuery && !autoSubmitted) {
      setAutoSubmitted(true);
      setInput("");
      submitQuery(initialQuery);
    }
  }, [initialQuery, autoSubmitted, submitQuery, loadConversation]);

  // Save conversation whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveConversation(messages);
      scrollToBottom();
    }
  }, [messages, saveConversation, scrollToBottom]);

  useEffect(() => {
    if (videoRef.current) {
      if (isTalking) {
        videoRef.current.play().catch((error) => {
          console.error("Failed to play video:", error);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isTalking]);

  // Check if this is the initial empty state (no messages)
  const isEmptyState = messages.length === 0 && !loadingSubmit;

  return (
    <div className="bg-background relative flex h-full flex-col overflow-hidden">
      {/* Subtle background gradient */}
      <div className="from-background via-background/95 to-background absolute inset-0 bg-gradient-to-br" />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Chat Controls */}
        <div className="flex justify-end px-6 py-1 border-b border-border/20">
          <div className="flex items-center gap-1">
            <button
              onClick={clearConversation}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md px-2 py-0.5 text-xs transition-all duration-200"
            >
              Clear
            </button>
            <WelcomeModal
              trigger={
                <button className="text-muted-foreground hover:text-foreground hover:bg-accent/5 rounded-md p-1 transition-all duration-200">
                  <Info className="h-3 w-3" />
                </button>
              }
            />
          </div>
        </div>

        {/* Messages Area with proper padding */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-4xl">
              <AnimatePresence mode="wait">
                {isEmptyState ? (
                  <motion.div
                    key="landing"
                    className="flex h-full items-center justify-center"
                    {...MOTION_CONFIG}
                  >
                    <ChatLanding submitQuery={submitQuery} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="conversation"
                    className="space-y-8"
                    {...MOTION_CONFIG}
                  >
                    {/* Conversation History */}
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: index * 0.05,
                          ease: "easeOut",
                        }}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className="group relative max-w-[85%]">
                          {/* Gemini-style Message Layout */}
                          <div
                            className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {/* Avatar for Assistant */}
                            {message.role === "assistant" && (
                              <div className="from-primary/20 to-accent/20 border-primary/20 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border bg-gradient-to-br">
                                <span className="text-primary text-sm font-bold">
                                  SA
                                </span>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div
                              className={`relative ${message.role === "user" ? "ml-8" : "mr-8"}`}
                            >
                              {/* User Message - Clean bubble style */}
                              {message.role === "user" ? (
                                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                                  <div className="prose prose-sm max-w-none">
                                    <ChatMessageContent
                                      message={message}
                                      isLast={index === messages.length - 1}
                                      isLoading={false}
                                      reload={() => Promise.resolve(null)}
                                    />
                                  </div>
                                  {/* Reserved space for timestamp */}
                                  <div className="mt-1 flex h-4 justify-end">
                                    <span className="text-primary-foreground/70 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                      {message.timestamp.toLocaleTimeString(
                                        [],
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                /* Assistant Message - Clean text style like Gemini */
                                <div className="text-foreground max-w-3xl">
                                  <div className="prose prose-sm max-w-none">
                                    <ChatMessageContent
                                      message={message}
                                      isLast={index === messages.length - 1}
                                      isLoading={
                                        isLoading &&
                                        message.role === "assistant" &&
                                        message.content === ""
                                      }
                                      reload={() => Promise.resolve(null)}
                                    />
                                  </div>
                                  {/* Reserved space for timestamp */}
                                  <div className="mt-3 flex h-4 justify-start">
                                    <span className="text-muted-foreground text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                      {message.timestamp.toLocaleTimeString(
                                        [],
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Info Icon */}
                          <button
                            onClick={() => {
                              setSelectedMessage(message);
                              setShowMessageInfo(true);
                            }}
                            className="text-muted-foreground hover:text-foreground hover:bg-accent/10 absolute top-0 -right-6 rounded-full p-1 opacity-0 transition-all duration-300 group-hover:opacity-100 hover:scale-110"
                          >
                            <Info className="h-3 w-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    {/* Gemini-style Typing Animation */}
                    {loadingSubmit && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex justify-start"
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="from-primary/15 to-accent/15 border-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border bg-gradient-to-br">
                            <span className="text-primary text-sm font-semibold">
                              SA
                            </span>
                          </div>

                          {/* Typing indicator */}
                          <div className="text-foreground">
                            <div className="flex items-center gap-1 py-1">
                              <motion.div
                                className="bg-primary/50 h-2 w-2 rounded-full"
                                animate={{
                                  scale: [1, 1.4, 1],
                                  opacity: [0.3, 1, 0.3],
                                }}
                                transition={{
                                  duration: 1.2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />
                              <motion.div
                                className="bg-primary/50 h-2 w-2 rounded-full"
                                animate={{
                                  scale: [1, 1.4, 1],
                                  opacity: [0.3, 1, 0.3],
                                }}
                                transition={{
                                  duration: 1.2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: 0.2,
                                }}
                              />
                              <motion.div
                                className="bg-primary/50 h-2 w-2 rounded-full"
                                animate={{
                                  scale: [1, 1.4, 1],
                                  opacity: [0.3, 1, 0.3],
                                }}
                                transition={{
                                  duration: 1.2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: 0.4,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Invisible element to scroll to */}
                    <div ref={messagesEndRef} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Minimal Input Area */}
        <div className="border-border/20 bg-background/60 relative z-10 border-t px-6 py-3 backdrop-blur-md">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-2">
              <HelperBoost
                submitQuery={submitQuery}
                setInput={setInput}
                hasReachedLimit={hasReachedLimit}
              />
              <ChatBottombar
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={onSubmit}
                isLoading={isLoading}
                stop={handleStop}
                isToolInProgress={isToolInProgress}
                disabled={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Message Info Dialog */}
      {selectedMessage && (
        <MessageInfoDialog
          message={selectedMessage}
          isOpen={showMessageInfo}
          onClose={() => {
            setShowMessageInfo(false);
            setSelectedMessage(null);
          }}
        />
      )}
    </div>
  );
};

export default Chat;

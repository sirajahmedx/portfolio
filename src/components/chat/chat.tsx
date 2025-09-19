"use client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

// Component imports
import ChatBottombar from "@/components/chat/chat-bottombar";
import ChatLanding from "@/components/chat/chat-landing";
import ChatMessageContent from "@/components/chat/chat-message-content";
import { Copy, Info } from "lucide-react";
import HelperBoost from "./HelperBoost";

// Message type definition
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Chat state interface
interface ChatState {
  messages: Message[];
  input: string;
  loadingSubmit: boolean;
  isTalking: boolean;
  hasReachedLimit: boolean;
  conversationLoaded: boolean;
  lastRequestTime: number;
  currentAssistantId: string | null;
  chunkCount: number;
}

// Action types
type ChatAction =
  | { type: "SET_INPUT"; payload: string }
  | { type: "ADD_MESSAGE"; payload: Message }
  | {
      type: "UPDATE_ASSISTANT_MESSAGE";
      payload: { id: string; content: string };
    }
  | {
      type: "START_ASSISTANT_MESSAGE";
      payload: { id: string; message: Message };
    }
  | { type: "SET_LOADING_SUBMIT"; payload: boolean }
  | { type: "SET_TALKING"; payload: boolean }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "CLEAR_CONVERSATION" }
  | { type: "SET_REACHED_LIMIT"; payload: boolean }
  | { type: "SET_CONVERSATION_LOADED"; payload: boolean }
  | { type: "SET_LAST_REQUEST_TIME"; payload: number }
  | { type: "INCREMENT_CHUNK_COUNT" }
  | { type: "RESET_STREAMING_STATE" };

// Initial state
const initialState: ChatState = {
  messages: [],
  input: "",
  loadingSubmit: false,
  isTalking: false,
  hasReachedLimit: false,
  conversationLoaded: false,
  lastRequestTime: 0,
  currentAssistantId: null,
  chunkCount: 0,
};

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_INPUT":
      return { ...state, input: action.payload };

    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case "START_ASSISTANT_MESSAGE":
      return {
        ...state,
        currentAssistantId: action.payload.id,
        messages: [...state.messages, action.payload.message],
        chunkCount: 0,
      };

    case "UPDATE_ASSISTANT_MESSAGE":
      const { id, content } = action.payload;
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === id ? { ...msg, content } : msg
        ),
      };

    case "SET_LOADING_SUBMIT":
      return { ...state, loadingSubmit: action.payload };

    case "SET_TALKING":
      return { ...state, isTalking: action.payload };

    case "SET_MESSAGES":
      return { ...state, messages: action.payload };

    case "CLEAR_CONVERSATION":
      return {
        ...state,
        messages: [],
        currentAssistantId: null,
        chunkCount: 0,
      };

    case "SET_REACHED_LIMIT":
      return { ...state, hasReachedLimit: action.payload };

    case "SET_CONVERSATION_LOADED":
      return { ...state, conversationLoaded: action.payload };

    case "SET_LAST_REQUEST_TIME":
      return { ...state, lastRequestTime: action.payload };

    case "INCREMENT_CHUNK_COUNT":
      return { ...state, chunkCount: state.chunkCount + 1 };

    case "RESET_STREAMING_STATE":
      return {
        ...state,
        currentAssistantId: null,
        chunkCount: 0,
        loadingSubmit: false,
        isTalking: false,
      };

    default:
      return state;
  }
}

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
  if (!isOpen || !message) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getMessageStats = (content: string) => {
    const words = content.trim().split(/\s+/).length;
    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, "").length;
    const readingTime = Math.ceil(words / 200); // Average reading speed

    return { words, characters, charactersNoSpaces, readingTime };
  };

  const stats = getMessageStats(message.content);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="from-background to-background/95 border-border/50 mx-4 max-w-lg rounded-2xl border bg-gradient-to-br p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-foreground text-lg font-semibold">
            Message Details
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-full p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Message Preview */}
          <div className="border-border/30 rounded-lg border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <p className="text-sm text-foreground line-clamp-3">
              {message.content}
            </p>
          </div>

          {/* Message Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-border/30 flex flex-col items-center rounded-lg border bg-muted/20 p-3">
              <span className="text-2xl font-bold text-primary">
                {stats.words}
              </span>
              <span className="text-xs text-muted-foreground">Words</span>
            </div>
            <div className="border-border/30 flex flex-col items-center rounded-lg border bg-muted/20 p-3">
              <span className="text-2xl font-bold text-primary">
                {stats.characters}
              </span>
              <span className="text-xs text-muted-foreground">Characters</span>
            </div>
            <div className="border-border/30 flex flex-col items-center rounded-lg border bg-muted/20 p-3">
              <span className="text-2xl font-bold text-primary">
                {stats.charactersNoSpaces}
              </span>
              <span className="text-xs text-muted-foreground">No Spaces</span>
            </div>
            <div className="border-border/30 flex flex-col items-center rounded-lg border bg-muted/20 p-3">
              <span className="text-2xl font-bold text-primary">
                {stats.readingTime}m
              </span>
              <span className="text-xs text-muted-foreground">Read Time</span>
            </div>
          </div>

          {/* Message Info */}
          <div className="space-y-3">
            <div className="border-border/30 flex items-center justify-between border-b py-2">
              <span className="text-muted-foreground text-sm">From</span>
              <span className="text-sm font-medium">
                {message.role === "assistant" ? "Siraj Ahmed" : "You"}
              </span>
            </div>
            <div className="border-border/30 flex items-center justify-between border-b py-2">
              <span className="text-muted-foreground text-sm">Sent</span>
              <span className="text-sm font-medium">
                {formatDate(message.timestamp)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground text-sm">Message ID</span>
              <span className="text-xs font-mono text-muted-foreground">
                {message.id.substring(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const assistantContentRef = useRef<string>("");

  // Chat state using reducer
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const {
    messages,
    input,
    loadingSubmit,
    isTalking,
    hasReachedLimit,
    conversationLoaded,
    lastRequestTime,
    currentAssistantId,
    chunkCount,
  } = state;

  // Local state for UI interactions
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageInfo, setShowMessageInfo] = useState(false);

  // In-memory storage for conversation
  const conversationStorageRef = useRef<Message[]>([]);

  // Copy message content to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("Copied to clipboard!");
      } catch (fallbackErr) {
        toast.error("Failed to copy text");
      }
      document.body.removeChild(textArea);
    }
  }, []);

  // Generate unique ID for messages
  const generateId = useCallback(
    () => Math.random().toString(36).substring(2, 15),
    []
  );

  // Load conversation from memory storage
  const loadConversation = useCallback(() => {
    if (conversationLoaded) return;

    try {
      console.log("[CLIENT] Loading conversation from memory...");
      if (conversationStorageRef.current.length > 0) {
        dispatch({
          type: "SET_MESSAGES",
          payload: conversationStorageRef.current,
        });
        console.log(
          "[CLIENT] Loaded",
          conversationStorageRef.current.length,
          "messages"
        );
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      dispatch({ type: "SET_CONVERSATION_LOADED", payload: true });
    }
  }, [conversationLoaded]);

  // Save conversation to memory storage
  const saveConversation = useCallback((messages: Message[]) => {
    try {
      conversationStorageRef.current = messages;
      console.log("[CLIENT] Saved", messages.length, "messages to memory");
    } catch (error) {
      console.error("Failed to save conversation:", error);
    }
  }, []);

  // Enhanced auto-scroll to bottom with mobile optimization
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // Use scrollTop for more reliable bottom scrolling
      const container = messagesEndRef.current.closest(".overflow-y-auto");
      if (container) {
        container.scrollTop = container.scrollHeight;
      } else {
        // Fallback to scrollIntoView
        messagesEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }
  }, []);

  // Auto-scroll when messages change or loading state changes
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, loadingSubmit, scrollToBottom]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    dispatch({ type: "CLEAR_CONVERSATION" });
    conversationStorageRef.current = [];
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "SET_INPUT", payload: e.target.value });
    },
    []
  );

  // Enhanced streaming response handler
  const handleStreamingResponse = useCallback(
    async (response: Response, assistantMessageId: string) => {
      if (!response.body) {
        throw new Error("No response body available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      assistantContentRef.current = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Process any remaining buffer
            if (buffer.trim()) {
              processBuffer(buffer, assistantMessageId);
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          buffer = processBuffer(buffer, assistantMessageId);
        }
      } finally {
        reader.releaseLock();
      }
    },
    []
  );

  // Process streaming buffer
  const processBuffer = useCallback(
    (buffer: string, assistantMessageId: string): string => {
      const lines = buffer.split("\n");
      let remainingBuffer = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            console.log("[CLIENT] Received [DONE] marker");
            return remainingBuffer;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.text && parsed.text.trim()) {
              assistantContentRef.current += parsed.text;
              dispatch({ type: "INCREMENT_CHUNK_COUNT" });

              console.log(
                `[CLIENT] Chunk ${chunkCount + 1}: "${parsed.text.substring(0, 50)}..."`
              );

              // Update the assistant message content
              dispatch({
                type: "UPDATE_ASSISTANT_MESSAGE",
                payload: {
                  id: assistantMessageId,
                  content: assistantContentRef.current,
                },
              });

              // Stop loading animation after first chunk
              if (chunkCount === 0) {
                // Loading animation handled by loadingSubmit state
              }

              // Auto-scroll to bottom
              setTimeout(scrollToBottom, 50);
            }
          } catch (parseError) {
            console.warn(
              "[CLIENT] Failed to parse streaming data:",
              data,
              parseError
            );
          }
        } else if (i === lines.length - 1 && line) {
          // Keep incomplete line for next iteration
          remainingBuffer = line;
        }
      }

      return remainingBuffer;
    },
    [chunkCount]
  );

  // Submit query to API
  const submitQuery = useCallback(
    async (query: string) => {
      if (!query.trim() || loadingSubmit) {
        console.log("[CLIENT] Submit blocked - invalid conditions");
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

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      dispatch({ type: "SET_LAST_REQUEST_TIME", payload: now });

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: trimmedQuery,
        timestamp: new Date(),
      };

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });
      dispatch({ type: "SET_INPUT", payload: "" });
      dispatch({ type: "SET_LOADING_SUBMIT", payload: true });
      dispatch({ type: "SET_TALKING", payload: true });

      // Play video
      if (videoRef.current) {
        videoRef.current.play().catch((error) => {
          console.error("Failed to play video:", error);
        });
      }

      // Create assistant message placeholder
      const assistantMessageId = generateId();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      dispatch({
        type: "START_ASSISTANT_MESSAGE",
        payload: { id: assistantMessageId, message: assistantMessage },
      });

      try {
        console.log("[CLIENT] Making API request...");

        // Build messages array including the new user message
        const messagesToSend = [...messages, userMessage];

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: messagesToSend.map((msg) => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp.toISOString(),
              id: msg.id,
            })),
          }),
          signal: abortControllerRef.current.signal,
        });

        console.log("[CLIENT] API response status:", response.status);

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;

            if (response.status === 429) {
              dispatch({ type: "SET_REACHED_LIMIT", payload: true });
              toast.error("API quota exceeded. Please try again tomorrow.");
            } else {
              toast.error(errorMessage);
            }
          } catch {
            toast.error(errorMessage);
          }

          throw new Error(errorMessage);
        }

        // Handle streaming response
        await handleStreamingResponse(response, assistantMessageId);

        console.log("[CLIENT] Request completed successfully");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("[CLIENT] Request was aborted");
          return;
        }

        console.error("[CLIENT] Chat error:", error);

        const isQuotaError =
          error instanceof Error &&
          (error.message.includes("QUOTA_EXCEEDED") ||
            error.message.includes("quota exceeded") ||
            error.message.includes("429"));

        if (isQuotaError) {
          dispatch({ type: "SET_REACHED_LIMIT", payload: true });
        }

        const errorMessage = isQuotaError
          ? "I've reached my daily conversation limit. Please try again tomorrow."
          : "Sorry, I encountered an error while processing your request. Please try again.";

        // Update assistant message with error
        dispatch({
          type: "UPDATE_ASSISTANT_MESSAGE",
          payload: {
            id: assistantMessageId,
            content: errorMessage,
          },
        });
      } finally {
        dispatch({ type: "RESET_STREAMING_STATE" });
        if (videoRef.current) {
          videoRef.current.pause();
        }
        abortControllerRef.current = null;
      }
    },
    [
      loadingSubmit,
      lastRequestTime,
      messages,
      generateId,
      handleStreamingResponse,
    ]
  );

  // Handle form submission
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const currentInput = input.trim();

      if (!currentInput || loadingSubmit) {
        return;
      }

      submitQuery(currentInput);
    },
    [input, loadingSubmit, submitQuery]
  );

  // Stop current request
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    dispatch({ type: "RESET_STREAMING_STATE" });
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const isToolInProgress = false; // Simplified - no tool support

  // Effects
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.pause();
    }

    // Load conversation from memory storage on mount
    if (!conversationLoaded) {
      loadConversation();
    }
  }, [loadConversation, conversationLoaded]);

  // Handle initial query submission
  useEffect(() => {
    if (initialQuery && !autoSubmitted && conversationLoaded) {
      setAutoSubmitted(true);
      submitQuery(initialQuery);
    }
  }, [initialQuery, autoSubmitted, submitQuery, conversationLoaded]);

  // Save conversation whenever messages change
  useEffect(() => {
    if (messages.length > 0 && conversationLoaded) {
      saveConversation(messages);
    }
  }, [messages, saveConversation, conversationLoaded]);

  // Control video based on talking state
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

  // Mobile keyboard handling and viewport adjustments
  useEffect(() => {
    const handleViewportChange = () => {
      // Small delay to ensure keyboard has fully appeared/disappeared
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    };

    const handleFocus = () => {
      // When input is focused on mobile, ensure we're scrolled to bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    };

    // Listen for viewport changes (keyboard show/hide)
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);

    // Listen for input focus events
    const inputElements = document.querySelectorAll("input, textarea");
    inputElements.forEach((input) => {
      input.addEventListener("focus", handleFocus);
    });

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
      inputElements.forEach((input) => {
        input.removeEventListener("focus", handleFocus);
      });
    };
  }, []);

  // Check if this is the initial empty state
  const isEmptyState = messages.length === 0 && !loadingSubmit;

  //chat
  return (
    <div className="bg-gradient-to-br from-background via-background/98 to-background/95 relative flex flex-col h-screen max-h-screen min-h-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      {/* Main Content Area - Full height container with proper scrolling isolation */}
      <div className="relative z-10 flex flex-col h-full overflow-hidden isolate">
        {/* Header - Fixed at top */}
        <div className="flex justify-end px-6 py-2 border-b border-border/30 bg-card/30 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={clearConversation}
              disabled={loadingSubmit}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              Clear
            </button>
            <button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/20 rounded-xl p-1.5 transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={() => {
                toast.info(
                  "This is Siraj Ahmed's AI assistant. Ask me anything!"
                );
              }}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Messages Area - Independent scrollable container */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col relative will-change-scroll">
          <div
            className="h-full overflow-y-auto px-4 pt-8 pb-32 md:pb-28 scroll-smooth"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
              scrollbarColor: "rgb(107 114 128 / 0.3) transparent",
            }}
          >
            <div className="mx-auto max-w-4xl">
              <AnimatePresence mode="wait">
                {isEmptyState ? (
                  <motion.div
                    key="landing"
                    className="flex h-full items-center justify-center py-8 px-4"
                    {...MOTION_CONFIG}
                  >
                    <ChatLanding
                      submitQuery={submitQuery}
                      hasReachedLimit={hasReachedLimit}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="conversation"
                    className="flex flex-col space-y-6 md:space-y-8 pb-6 min-h-full"
                    {...MOTION_CONFIG}
                  >
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: Math.min(index * 0.05, 0.3),
                          ease: "easeOut",
                        }}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className="group relative max-w-[85%]">
                          <div
                            className={`flex items-start gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {message.role === "assistant" &&
                              message.content.trim() !== "" && (
                                <div className="from-primary/20 via-primary/10 to-accent/20 border-primary/30 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-md">
                                  <span className="text-primary text-sm font-bold">
                                    SA
                                  </span>
                                </div>
                              )}

                            <div
                              className={`relative ${message.role === "user" ? "ml-8" : "mr-8"}`}
                            >
                              {message.role === "user" ? (
                                <div className="bg-primary/10 text-primary-foreground border-primary/20 rounded-3xl rounded-br-lg px-5 py-4 shadow-lg border backdrop-blur-sm">
                                  <div className="prose prose-sm max-w-none text-foreground">
                                    <ChatMessageContent
                                      message={message}
                                      isLast={index === messages.length - 1}
                                      isLoading={false}
                                      reload={() => Promise.resolve(null)}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="text-foreground max-w-3xl">
                                  <div className="prose prose-sm max-w-none">
                                    <ChatMessageContent
                                      message={message}
                                      isLast={index === messages.length - 1}
                                      isLoading={
                                        loadingSubmit &&
                                        message.role === "assistant" &&
                                        message.content === ""
                                      }
                                      reload={() => Promise.resolve(null)}
                                    />
                                  </div>
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

                          <div className="absolute top-0 -right-8 flex flex-col gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100">
                            <button
                              onClick={() => copyToClipboard(message.content)}
                              className="text-muted-foreground hover:text-foreground hover:bg-accent/20 rounded-xl p-1.5 transition-all duration-200 hover:scale-110 active:scale-95"
                              title="Copy message"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMessage(message);
                                setShowMessageInfo(true);
                              }}
                              className="text-muted-foreground hover:text-foreground hover:bg-accent/20 rounded-xl p-1.5 transition-all duration-200 hover:scale-110 active:scale-95"
                              title="Message details"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {loadingSubmit && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex justify-start"
                      >
                        <div className="flex items-start gap-4">
                          <div className="from-primary/15 to-accent/15 border-primary/20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-md">
                            <span className="text-primary text-sm font-semibold">
                              SA
                            </span>
                          </div>
                          <div className="text-foreground">
                            <div className="flex items-center gap-1.5 py-2">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="bg-primary/60 h-2.5 w-2.5 rounded-full"
                                  animate={{
                                    scale: [1, 1.4, 1],
                                    opacity: [0.4, 1, 0.4],
                                  }}
                                  transition={{
                                    duration: 1.2,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeInOut",
                                    delay: i * 0.2,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom bar positioned absolutely - stays fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-border/30 bg-card/60 z-[100] border-t px-4 md:px-6 py-3 md:py-4 backdrop-blur-xl min-h-[120px] md:min-h-[100px] flex-shrink-0 shadow-2xl">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-3">
              <HelperBoost
                submitQuery={submitQuery}
                setInput={(value: string) =>
                  dispatch({ type: "SET_INPUT", payload: value })
                }
                hasReachedLimit={hasReachedLimit}
              />
              <ChatBottombar
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={onSubmit}
                isLoading={loadingSubmit}
                stop={handleStop}
                isToolInProgress={isToolInProgress}
                disabled={hasReachedLimit}
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

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
  useReducer,
} from "react";
import { toast } from "sonner";

// Component imports
import ChatBottombar from "@/components/chat/chat-bottombar";
import ChatLanding from "@/components/chat/chat-landing";
import ChatMessageContent from "@/components/chat/chat-message-content";
import { Info } from "lucide-react";
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
  isLoading: boolean;
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
  | { type: "SET_LOADING"; payload: boolean }
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
  isLoading: false,
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

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

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
        isLoading: false,
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const assistantContentRef = useRef<string>("");

  // Chat state using reducer
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const {
    messages,
    input,
    isLoading,
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

  // Enhanced auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      });
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
                dispatch({ type: "SET_LOADING", payload: false });
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
    [chunkCount, scrollToBottom]
  );

  // Submit query to API
  const submitQuery = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading || loadingSubmit) {
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
      dispatch({ type: "SET_LOADING", payload: true });
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
      isLoading,
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

      if (!currentInput || isLoading || loadingSubmit) {
        return;
      }

      submitQuery(currentInput);
    },
    [input, isLoading, loadingSubmit, submitQuery]
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

  // Reload last message
  const reload = useCallback(async () => {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    if (lastUserMessage) {
      await submitQuery(lastUserMessage.content);
    }
    return null;
  }, [messages, submitQuery]);

  // Computed values
  const { hasActiveTool } = useMemo(
    () => ({
      hasActiveTool: false, // Simplified - no tool support for now
    }),
    []
  );

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Check if this is the initial empty state
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
              disabled={isLoading || loadingSubmit}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md px-2 py-0.5 text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/5 rounded-md p-1 transition-all duration-200"
              onClick={() => {
                // Could add help modal here
                toast.info(
                  "This is Siraj Ahmed's AI assistant. Ask me anything!"
                );
              }}
            >
              <Info className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
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
                          delay: Math.min(index * 0.05, 0.3),
                          ease: "easeOut",
                        }}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className="group relative max-w-[85%]">
                          {/* Message Layout */}
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

                    {/* Typing Animation */}
                    {loadingSubmit && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex justify-start"
                      >
                        <div className="flex items-start gap-3">
                          <div className="from-primary/15 to-accent/15 border-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border bg-gradient-to-br">
                            <span className="text-primary text-sm font-semibold">
                              SA
                            </span>
                          </div>
                          <div className="text-foreground">
                            <div className="flex items-center gap-1 py-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="bg-primary/50 h-2 w-2 rounded-full"
                                  animate={{
                                    scale: [1, 1.4, 1],
                                    opacity: [0.3, 1, 0.3],
                                  }}
                                  transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
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

                    {/* Scroll target */}
                    <div ref={messagesEndRef} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-border/20 bg-background/60 relative z-10 border-t px-6 py-3 backdrop-blur-md">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-2">
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
                isLoading={isLoading || loadingSubmit}
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

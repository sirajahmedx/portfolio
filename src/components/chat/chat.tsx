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

import ChatLanding from "@/components/chat/chat-landing";
import ChatMessageContent from "@/components/chat/chat-message-content";
import StyleSelector from "@/components/chat/style-selector";
import { Copy, Info, Loader2, ChevronUp, ChevronLeft } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: Message[];
  input: string;
  loadingSubmit: boolean;
  conversationLoaded: boolean;
  lastRequestTime: number;
  currentAssistantId: string | null;
  chunkCount: number;
  selectedStyle: "polite" | "concise" | "versatile" | "creative";
}

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
  | { type: "SET_CONVERSATION_LOADED"; payload: boolean }
  | { type: "SET_LAST_REQUEST_TIME"; payload: number }
  | { type: "INCREMENT_CHUNK_COUNT" }
  | { type: "RESET_STREAMING_STATE" }
  | {
      type: "SET_SELECTED_STYLE";
      payload: "polite" | "concise" | "versatile" | "creative";
    };

const initialState: ChatState = {
  messages: [],
  input: "",
  loadingSubmit: false,
  conversationLoaded: false,
  lastRequestTime: 0,
  currentAssistantId: null,
  chunkCount: 0,
  selectedStyle: "polite",
};

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

    case "SET_MESSAGES":
      return { ...state, messages: action.payload };

    case "CLEAR_CONVERSATION":
      return {
        ...state,
        messages: [],
        currentAssistantId: null,
        chunkCount: 0,
      };

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
      };

    case "SET_SELECTED_STYLE":
      return { ...state, selectedStyle: action.payload };

    default:
      return state;
  }
}

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
    const readingTime = Math.ceil(words / 200);

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const isUserScrolling = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNearBottom = useRef<boolean>(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query");
  const initialStyle = searchParams.get("style") as
    | "polite"
    | "concise"
    | "versatile"
    | "creative"
    | null;
  const abortControllerRef = useRef<AbortController | null>(null);
  const assistantContentRef = useRef<string>("");

  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    selectedStyle: initialStyle || "polite",
  });
  const {
    messages,
    input,
    loadingSubmit,
    conversationLoaded,
    lastRequestTime,
    chunkCount,
    selectedStyle,
  } = state;

  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(
    null
  );

  const conversationStorageRef = useRef<Message[]>([]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("Copied to clipboard!");
      } catch {
        toast.error("Failed to copy text");
      }
      document.body.removeChild(textArea);
    }
  }, []);

  const generateId = useCallback(
    () => Math.random().toString(36).substring(2, 15),
    []
  );

  const loadConversation = useCallback(() => {
    if (conversationLoaded) return;

    try {
      if (conversationStorageRef.current.length > 0) {
        dispatch({
          type: "SET_MESSAGES",
          payload: conversationStorageRef.current,
        });
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      dispatch({ type: "SET_CONVERSATION_LOADED", payload: true });
    }
  }, [conversationLoaded]);

  const saveConversation = useCallback((messages: Message[]) => {
    try {
      conversationStorageRef.current = messages;
    } catch (error) {
      console.error("Failed to save conversation:", error);
    }
  }, []);

  const scrollToBottom = useCallback((force: boolean = false) => {
    const container = scrollContainerRef.current;
    if (!container) {
      console.log("[SCROLL] Container not found, using fallback");
      // Fallback to messagesEndRef
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
      return;
    }

    console.log("[SCROLL] Attempting to scroll", {
      force,
      isUserScrolling: isUserScrolling.current,
    });

    // Always scroll when forced (focus, new messages, etc.)
    if (force) {
      console.log("[SCROLL] Force scrolling to bottom");
      // Use immediate scroll for force mode to prevent partial scroll states
      container.scrollTop = container.scrollHeight;
      return;
    }

    // Prevent excessive scrolling
    const now = Date.now();
    if (now - lastScrollTime.current < 50) {
      // Reduced throttling for smoother updates
      console.log("[SCROLL] Throttled - too recent");
      return;
    }
    lastScrollTime.current = now;

    // Check if user is near bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < 100; // Reduced threshold for more responsive scrolling

    console.log("[SCROLL] Scroll state:", {
      scrollTop,
      scrollHeight,
      clientHeight,
      distanceFromBottom,
      isNearBottom,
      isUserScrolling: isUserScrolling.current,
    });

    // Auto-scroll if near bottom or not manually scrolling
    if (isNearBottom || !isUserScrolling.current) {
      console.log("[SCROLL] Scrolling to bottom");
      container.scrollTo({
        top: scrollHeight,
        behavior: "smooth",
      });
    } else {
      console.log(
        "[SCROLL] Skipping scroll - user not near bottom or is scrolling"
      );
    }
  }, []);

  // Handle user scroll detection
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isUserScrolling.current = true;

    // Check if user is near bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100; // Reduced threshold to match scrollToBottom
    isNearBottom.current = nearBottom;
    setShowScrollButton(!nearBottom && scrollTop > 200);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 1000); // Reduced timeout for more responsive auto-scrolling
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        container.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [handleScroll]);

  // Intersection observer for better scroll behavior
  useEffect(() => {
    const endElement = messagesEndRef.current;
    if (!endElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isNearBottom.current = entry.isIntersecting;
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1,
        rootMargin: "0px 0px 50px 0px", // Reduced margin for more precise detection
      }
    );

    observer.observe(endElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Smooth scroll to bottom when messages change
  useEffect(() => {
    // More responsive scroll for new messages
    const timer = setTimeout(() => scrollToBottom(), 25); // Reduced delay for faster response
    return () => clearTimeout(timer);
  }, [messages, loadingSubmit, scrollToBottom]);

  const clearConversation = useCallback(() => {
    dispatch({ type: "CLEAR_CONVERSATION" });
    conversationStorageRef.current = [];
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleStyleChange = useCallback(
    (style: "polite" | "concise" | "versatile" | "creative") => {
      dispatch({ type: "SET_SELECTED_STYLE", payload: style });
    },
    []
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      dispatch({ type: "SET_INPUT", payload: e.target.value });

      const textarea = e.target;
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    },
    []
  );

  useEffect(() => {
    if (textareaRef) {
      textareaRef.style.height = "auto";
      const scrollHeight = textareaRef.scrollHeight;
      const newHeight = Math.min(scrollHeight, 120);
      textareaRef.style.height = `${newHeight}px`;
    }
  }, [input, textareaRef]);

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

  const processBuffer = useCallback(
    (buffer: string, assistantMessageId: string): string => {
      const lines = buffer.split("\n");
      let remainingBuffer = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            return remainingBuffer;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            // Handle structured responses (skills, resume, projects, etc.)
            if (
              parsed.responseType &&
              typeof parsed.chunk === "number" &&
              parsed.text !== undefined
            ) {
              assistantContentRef.current +=
                parsed.text + (parsed.isComplete ? "" : "\n");
              dispatch({ type: "INCREMENT_CHUNK_COUNT" });

              dispatch({
                type: "UPDATE_ASSISTANT_MESSAGE",
                payload: {
                  id: assistantMessageId,
                  content: assistantContentRef.current,
                },
              });

              if (parsed.isComplete) {
                console.log(
                  `[CHAT-UI] Completed structured response: ${parsed.responseType}`
                );
              }
            }
            // Handle regular streaming responses
            else if (parsed.text && parsed.text.trim()) {
              assistantContentRef.current += parsed.text;
              dispatch({ type: "INCREMENT_CHUNK_COUNT" });

              dispatch({
                type: "UPDATE_ASSISTANT_MESSAGE",
                payload: {
                  id: assistantMessageId,
                  content: assistantContentRef.current,
                },
              });
            }

            if (chunkCount === 0) {
            }

            // More frequent scroll during streaming for better UX
            if (chunkCount % 2 === 0) {
              // Scroll every 2nd chunk instead of 3rd
              setTimeout(() => scrollToBottom(), 50); // Reduced delay
            }
          } catch (parseError) {
            console.warn(
              "[CHAT-UI] Failed to parse streaming data:",
              data,
              parseError
            );
          }
        } else if (i === lines.length - 1 && line) {
          remainingBuffer = line;
        }
      }

      return remainingBuffer;
    },
    [chunkCount]
  );

  const submitQuery = useCallback(
    async (query: string) => {
      if (!query.trim() || loadingSubmit) {
        return;
      }

      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < 2000) {
        toast.error("Please wait a moment before sending another message.");
        return;
      }

      const trimmedQuery = query.trim();

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      dispatch({ type: "SET_LAST_REQUEST_TIME", payload: now });

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: trimmedQuery,
        timestamp: new Date(),
      };

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });
      dispatch({ type: "SET_INPUT", payload: "" });
      dispatch({ type: "SET_LOADING_SUBMIT", payload: true });

      // Force scroll to bottom after adding user message
      setTimeout(() => scrollToBottom(true), 100);

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
            style: selectedStyle,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;

          try {
            const errorData = await response.json();
            // Handle both string and object error formats
            if (typeof errorData.error === "string") {
              errorMessage = errorData.error;
            } else if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }

            toast.error(errorMessage);
          } catch {
            toast.error(errorMessage);
          }

          throw new Error(errorMessage);
        }

        await handleStreamingResponse(response, assistantMessageId);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        const isQuotaError =
          error instanceof Error &&
          (error.message.includes("QUOTA_EXCEEDED") ||
            error.message.includes("quota exceeded") ||
            error.message.includes("429"));

        const errorMessage = isQuotaError
          ? "I've reached my daily conversation limit. Please try again tomorrow."
          : "Sorry, I encountered an error while processing your request. Please try again.";

        dispatch({
          type: "UPDATE_ASSISTANT_MESSAGE",
          payload: {
            id: assistantMessageId,
            content: errorMessage,
          },
        });
      } finally {
        dispatch({ type: "RESET_STREAMING_STATE" });
        abortControllerRef.current = null;
      }
    },
    [
      loadingSubmit,
      lastRequestTime,
      messages,
      generateId,
      handleStreamingResponse,
      scrollToBottom,
    ]
  );

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

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    dispatch({ type: "RESET_STREAMING_STATE" });
  }, []);

  const isToolInProgress = false;

  useEffect(() => {
    if (!conversationLoaded) {
      loadConversation();
    }
  }, [loadConversation, conversationLoaded]);

  useEffect(() => {
    if (initialQuery && !autoSubmitted && conversationLoaded) {
      setAutoSubmitted(true);
      submitQuery(initialQuery);
    }
  }, [initialQuery, autoSubmitted, submitQuery, conversationLoaded]);

  useEffect(() => {
    if (messages.length > 0 && conversationLoaded) {
      saveConversation(messages);
    }
  }, [messages, saveConversation, conversationLoaded]);

  useEffect(() => {
    const handleViewportChange = () => {
      setTimeout(() => {
        scrollToBottom(true); // Force scroll on viewport change
      }, 200); // Reduced delay for more responsive behavior
    };

    const handleFocus = () => {
      setTimeout(() => {
        scrollToBottom(true); // Force scroll on focus
      }, 50); // Reduced delay for immediate response
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);

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

  const isEmptyState = messages.length === 0 && !loadingSubmit;

  const userAskedAboutProjects = messages.some(
    (msg) =>
      msg.role === "user" &&
      (msg.content.toLowerCase().includes("project") ||
        msg.content.toLowerCase().includes("work") ||
        msg.content.toLowerCase().includes("portfolio") ||
        msg.content.toLowerCase().includes("jobify") ||
        msg.content.toLowerCase().includes("tradesman") ||
        msg.content.toLowerCase().includes("talent-tube") ||
        msg.content.toLowerCase().includes("tuneit") ||
        msg.content.toLowerCase().includes("github bot") ||
        msg.content.toLowerCase().includes("sensify"))
  );

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 relative flex flex-col h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      <div className="relative z-10 flex flex-col h-full overflow-hidden isolate">
        <div className="flex justify-between items-center px-6 py-2 border-b border-border/30 bg-card/30 backdrop-blur-sm flex-shrink-0">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground hover:bg-accent/20 rounded-xl p-1.5 transition-all duration-200 hover:scale-105 active:scale-95"
            title="Go to Home"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
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

        <div className="flex-1 overflow-hidden min-h-0 flex flex-col relative will-change-scroll">
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto px-4 pt-8 pb-48 md:pb-44 scroll-smooth"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
              scrollbarColor: "rgb(107 114 128 / 0.3) transparent",
              scrollBehavior: "smooth",
              scrollPadding: "1rem",
              scrollSnapType: "y proximity",
              scrollMargin: "1rem",
              overscrollBehavior: "contain",
            }}
          >
            <div className="mx-auto max-w-3xl">
              <AnimatePresence mode="wait">
                {isEmptyState ? (
                  <motion.div
                    key="landing"
                    className="flex h-full items-center justify-center py-8 px-4"
                    {...MOTION_CONFIG}
                  >
                    <ChatLanding submitQuery={submitQuery} />
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
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} w-full`}
                      >
                        <div
                          className={`group relative ${
                            message.role === "assistant" 
                              ? "w-full" 
                              : "w-full max-w-[75%]"
                          }`}
                        >
                          <div
                            className={`flex items-start gap-4 ${message.role === "user" ? "flex-row-reverse justify-start" : "flex-row"}`}
                          >
                            <div
                              className={`relative w-full ${message.role === "user" ? "" : ""}`}
                            >
                              {message.role === "user" ? (
                                <div className="bg-primary/10 text-primary-foreground border-primary/20 rounded-2xl rounded-br-md px-4 py-3 shadow-md border backdrop-blur-sm w-full">
                                  <div className="prose prose-base max-w-none text-foreground">
                                    <ChatMessageContent
                                      message={message}
                                      isLast={index === messages.length - 1}
                                      isLoading={false}
                                      reload={() => Promise.resolve(null)}
                                      showProjectsButton={
                                        userAskedAboutProjects
                                      }
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="text-foreground w-full">
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
                                      showProjectsButton={
                                        userAskedAboutProjects
                                      }
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

                          <div className={`absolute top-0 ${message.role === "user" ? "-left-8" : "-right-8"} flex flex-col gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100`}>
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

        <div className="absolute bottom-0 left-0 right-0 z-[100] bg-background/80 border-t border-border/30 min-h-[120px] md:min-h-[100px] flex-shrink-0 shadow-2xl backdrop-blur-md py-3 sm:px-4 md:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <form onSubmit={onSubmit} className="relative">
              <div
                className="flex items-end rounded-full border-2  
               border-border/80 p-2 sm:p-2.5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-border/90 focus-within:!border-primary/50 focus-within:!shadow-lg focus-within:!shadow-primary/10"
              >
                <textarea
                  ref={setTextareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onFocus={() => {
                    // Scroll to bottom when user focuses on input
                    setTimeout(() => scrollToBottom(true), 100);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!loadingSubmit && input.trim() && !isToolInProgress) {
                        onSubmit(e as any);
                      }
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="flex-1 border-none bg-transparent px-3 py-3 sm:px-4 sm:py-3 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none resize-none overflow-hidden"
                  style={{
                    height: "auto",
                    minHeight: "48px",
                    maxHeight: "200px",
                  }}
                  rows={1}
                  disabled={isToolInProgress || loadingSubmit}
                />
                <div className="flex items-center mr-2">
                  <StyleSelector
                    selectedStyle={selectedStyle}
                    onStyleChange={handleStyleChange}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingSubmit || !input.trim() || isToolInProgress}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center px-3 py-3 rounded-full mb-1 transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                  onClick={(e) => {
                    if (loadingSubmit) {
                      e.preventDefault();
                      handleStop();
                    }
                  }}
                >
                  {loadingSubmit ? (
                    <Loader2 className="h-4 w-4 md:h-4 md:w-4 animate-spin" />
                  ) : (
                    <ChevronUp className="h-4 w-4 md:h-4 md:w-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={() => scrollToBottom(true)}
            className="fixed bottom-28 md:bottom-24 right-6 z-50 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            title="Scroll to bottom"
          >
            <ChevronUp className="h-5 w-5 rotate-180" />
          </motion.button>
        )}
      </AnimatePresence>

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

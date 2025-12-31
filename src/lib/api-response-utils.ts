// API Response formatting utilities for consistent structure across all endpoints

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    type: string;
    code: number;
    details?: Record<string, any>;
  };
  timestamp: string;
  requestId?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    type: string;
    code: number;
    details?: Record<string, any>;
  };
  timestamp: string;
  requestId?: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

export interface StreamingChunk {
  text: string;
  chunk: number;
  timestamp: string;
  isComplete?: boolean;
  semantic?: {
    chunks?: import("./text-chunker").TextChunk[];
    totalChunks?: number;
    isAnalyzed?: boolean;
  };
}

export interface StreamingError {
  error: string;
  type: string;
  timestamp: string;
  chunk?: number;
}

// Standardized error types
export const ERROR_TYPES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  API_ERROR: "API_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  PARSE_ERROR: "PARSE_ERROR",
  METHOD_DEPRECATED: "METHOD_DEPRECATED",
} as const;

export type ErrorType = keyof typeof ERROR_TYPES;

// HTTP status code mappings
export const ERROR_STATUS_MAP: Record<ErrorType, number> = {
  VALIDATION_ERROR: 400,
  AUTH_ERROR: 401,
  RATE_LIMIT_ERROR: 429,
  API_ERROR: 500,
  NETWORK_ERROR: 503,
  QUOTA_EXCEEDED: 429,
  UNKNOWN_ERROR: 500,
  PARSE_ERROR: 400,
  METHOD_DEPRECATED: 405,
};

// Utility functions for creating standardized responses
export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function createErrorResponse(
  type: ErrorType,
  message: string,
  details?: Record<string, any>,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error: {
      message,
      type,
      code: ERROR_STATUS_MAP[type],
      details,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function createStreamingChunk(
  text: string,
  chunkNumber: number,
  isComplete = false,
  fullText?: string
): StreamingChunk {
  const chunk: StreamingChunk = {
    text,
    chunk: chunkNumber,
    timestamp: new Date().toISOString(),
    isComplete,
  };

  // If this is the final chunk and we have full text, add semantic analysis
  if (isComplete && fullText && fullText.trim()) {
    const { chunkText } = require("./text-chunker");
    try {
      const semanticChunks = chunkText(fullText, {
        fontSizeReduction: 20,
        maxChunkLength: 150,
        minChunkLength: 25,
      });

      chunk.semantic = {
        chunks: semanticChunks,
        totalChunks: semanticChunks.length,
        isAnalyzed: true,
      };
    } catch (error) {
      console.warn("Semantic chunking failed:", error);
      chunk.semantic = {
        isAnalyzed: false,
      };
    }
  }

  return chunk;
}

export function createStreamingError(
  message: string,
  type: ErrorType,
  chunkNumber?: number
): StreamingError {
  return {
    error: message,
    type,
    timestamp: new Date().toISOString(),
    chunk: chunkNumber,
  };
}

// Standardized date formatting
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDisplayDate(date);
}

// Standardized text formatting
export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => capitalizeFirst(word))
    .join(" ");
}

export function formatErrorMessage(message: string): string {
  // Ensure error messages start with capital letter and end with appropriate punctuation
  let formatted = message.trim();
  if (formatted && !formatted[0].match(/[A-Z]/)) {
    formatted = capitalizeFirst(formatted);
  }
  if (formatted && !formatted.match(/[.!?]$/)) {
    formatted += ".";
  }
  return formatted;
}

// Validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateMessageContent(content: string): {
  isValid: boolean;
  error?: string;
} {
  if (!content || typeof content !== "string") {
    return {
      isValid: false,
      error: "Message content must be a non-empty string",
    };
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Message content cannot be empty" };
  }

  if (trimmed.length > 10000) {
    return {
      isValid: false,
      error: "Message content cannot exceed 10,000 characters",
    };
  }

  return { isValid: true };
}

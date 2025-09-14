import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from './prompt';

// Tool imports (currently unused but keeping for future implementation)

export const maxDuration = 30;

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced error handler with specific error types
interface ErrorResponse {
  message: string;
  type: string;
  status: number;
}

function errorHandler(error: unknown): ErrorResponse {
  if (error == null) {
    return {
      message: 'An unknown error occurred',
      type: 'UNKNOWN_ERROR',
      status: 500
    };
  }
  
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'STRING_ERROR',
      status: 500
    };
  }
  
  if (error instanceof Error) {
    // Quota exceeded error
    if (error.message.includes('429') || 
        error.message.includes('Too Many Requests') || 
        error.message.includes('quota') ||
        error.message.toLowerCase().includes('resource has been exhausted')) {
      return {
        message: 'API quota exceeded. Please try again tomorrow or upgrade your plan.',
        type: 'QUOTA_EXCEEDED',
        status: 429
      };
    }

    // Authentication errors
    if (error.message.includes('401') || 
        error.message.includes('unauthorized') ||
        error.message.includes('API key')) {
      return {
        message: 'Authentication failed. Please check your API key configuration.',
        type: 'AUTH_ERROR',
        status: 401
      };
    }

    // Network/connection errors
    if (error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('connection')) {
      return {
        message: 'Network error. Please check your connection and try again.',
        type: 'NETWORK_ERROR',
        status: 503
      };
    }

    return {
      message: error.message,
      type: 'API_ERROR',
      status: 500
    };
  }

  return {
    message: JSON.stringify(error),
    type: 'UNKNOWN_ERROR',
    status: 500
  };
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rateLimitData = rateLimitMap.get(ip);

  if (!rateLimitData) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return false;
  }

  const { count, timestamp } = rateLimitData;

  // Reset window if expired
  if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return false;
  }

  // Check if rate limited
  if (count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Increment count
  rateLimitMap.set(ip, { count: count + 1, timestamp });
  return false;
}

// Message validation
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  id?: string;
}

function validateMessages(messages: any[]): Message[] {
  if (!Array.isArray(messages)) {
    throw new Error('Messages must be an array');
  }

  if (messages.length === 0) {
    throw new Error('At least one message is required');
  }

  return messages.map((msg, index) => {
    if (!msg || typeof msg !== 'object') {
      throw new Error(`Invalid message format at index ${index}: must be an object`);
    }

    if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
      throw new Error(`Invalid role at index ${index}: must be 'user' or 'assistant'`);
    }

    if (!msg.content || typeof msg.content !== 'string') {
      throw new Error(`Invalid content at index ${index}: must be a non-empty string`);
    }

    if (msg.content.trim().length === 0) {
      throw new Error(`Empty content at index ${index}`);
    }

    // Validate content length (prevent extremely long messages)
    if (msg.content.length > 10000) {
      throw new Error(`Message too long at index ${index}: maximum 10,000 characters`);
    }

    return {
      role: msg.role,
      content: msg.content.trim(),
      timestamp: msg.timestamp,
      id: msg.id
    };
  });
}

// Enhanced streaming response handler
async function createStreamingResponse(result: any): Promise<ReadableStream> {
  return new ReadableStream({
    async start(controller) {
      let totalChunks = 0;
      let totalText = '';

      try {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText && chunkText.trim()) {
            totalChunks++;
            totalText += chunkText;
            
            // Log chunk info for debugging
            console.log(`[CHAT-API] Chunk ${totalChunks}: "${chunkText.substring(0, 100)}${chunkText.length > 100 ? '...' : ''}"`);

            // Send chunk to client
            const chunkData = JSON.stringify({ 
              text: chunkText,
              chunk: totalChunks 
            });
            controller.enqueue(new TextEncoder().encode(`data: ${chunkData}\n\n`));
          }
        }

        console.log(`[CHAT-API] Streaming complete. Total chunks: ${totalChunks}, Total text length: ${totalText.length}`);
        
        // Send completion signal
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();

      } catch (streamError) {
        console.error('[CHAT-API] Streaming error:', streamError);
        const errorInfo = errorHandler(streamError);
        
        // Send error to client
        const errorData = JSON.stringify({ 
          error: errorInfo.message,
          type: errorInfo.type 
        });
        controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    }
  });
}

// Main POST handler
export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    // Get client IP for rate limiting (with better IP detection)
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnecting = req.headers.get('cf-connecting-ip');
    const ip = cfConnecting || forwarded?.split(',')[0]?.trim() || realIP || 'unknown';
    
    console.log(`[CHAT-API] Request from IP: ${ip}`);
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      console.log(`[CHAT-API] Rate limited IP: ${ip}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          type: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
        }), 
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(RATE_LIMIT_WINDOW_MS / 1000).toString()
          }
        }
      );
    }

    // Parse and validate request body
    let body;
    try {
      const text = await req.text();
      if (!text.trim()) {
        throw new Error('Empty request body');
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('[CHAT-API] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          type: 'PARSE_ERROR'
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate messages
    let validatedMessages: Message[];
    try {
      validatedMessages = validateMessages(body.messages);
    } catch (validationError) {
      console.error('[CHAT-API] Message validation failed:', validationError);
      return new Response(
        JSON.stringify({ 
          error: validationError instanceof Error ? validationError.message : 'Invalid message format',
          type: 'VALIDATION_ERROR'
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[CHAT-API] Processing ${validatedMessages.length} messages`);
    console.log(`[CHAT-API] Last message preview: "${validatedMessages[validatedMessages.length - 1].content.substring(0, 100)}..."`);

    // Initialize Gemini model with error handling
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048, // Increased for better responses
        }
      });
    } catch (modelError) {
      console.error('[CHAT-API] Failed to initialize Gemini model:', modelError);
      const errorInfo = errorHandler(modelError);
      return new Response(
        JSON.stringify({ 
          error: errorInfo.message,
          type: errorInfo.type
        }), 
        { 
          status: errorInfo.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert messages to Gemini format (all messages except the last one for history)
    const history = validatedMessages.slice(0, -1).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    console.log(`[CHAT-API] Conversation history length: ${history.length}`);

    // Start chat with history
    const chat = model.startChat({ history });

    // Get the last message to respond to
    const lastMessage = validatedMessages[validatedMessages.length - 1];
    
    // Construct the full prompt
    const fullPrompt = `${SYSTEM_PROMPT.content}\n\nUser: ${lastMessage.content}`;
    
    console.log('[CHAT-API] Sending request to Gemini API...');

    // Send message and get streaming response
    let result;
    try {
      result = await chat.sendMessageStream(fullPrompt);
    } catch (apiError) {
      console.error('[CHAT-API] Gemini API error:', apiError);
      const errorInfo = errorHandler(apiError);
      return new Response(
        JSON.stringify({ 
          error: errorInfo.message,
          type: errorInfo.type
        }), 
        { 
          status: errorInfo.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[CHAT-API] Creating streaming response...');

    // Create streaming response
    const stream = await createStreamingResponse(result);

    const processingTime = Date.now() - startTime;
    console.log(`[CHAT-API] Request processed in ${processingTime}ms`);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Processing-Time': processingTime.toString()
      },
    });

  } catch (globalError) {
    const processingTime = Date.now() - startTime;
    console.error('[CHAT-API] Global error:', globalError);
    const errorInfo = errorHandler(globalError);

    return new Response(
      JSON.stringify({ 
        error: errorInfo.message,
        type: errorInfo.type,
        processingTime
      }), 
      { 
        status: errorInfo.status,
        headers: { 
          'Content-Type': 'application/json',
          'X-Processing-Time': processingTime.toString()
        }
      }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

// Simplified GET handler (keeping for backward compatibility but not recommended for production)
export async function GET(req: Request) {
  try {
    console.log('[CHAT-API] GET request received (deprecated method)');
    
    const url = new URL(req.url);
    const messagesParam = url.searchParams.get('messages');
    
    if (!messagesParam) {
      return new Response(
        JSON.stringify({ 
          error: 'Messages parameter is required',
          type: 'MISSING_PARAMETER'
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let messages;
    try {
      messages = JSON.parse(decodeURIComponent(messagesParam));
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid messages format in query parameter',
          type: 'PARSE_ERROR'
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Redirect GET requests to use POST method
    return new Response(
      JSON.stringify({
        error: 'GET method is deprecated. Please use POST method instead.',
        type: 'METHOD_DEPRECATED',
        recommendation: 'Use POST /api/chat with messages in the request body'
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'POST, OPTIONS'
        }
      }
    );

  } catch (error) {
    console.error('[CHAT-API] GET handler error:', error);
    const errorInfo = errorHandler(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorInfo.message,
        type: errorInfo.type
      }), 
      { 
        status: errorInfo.status,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
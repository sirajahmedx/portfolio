import Groq from 'groq-sdk';
import { SYSTEM_PROMPT } from './prompt';

export const maxDuration = 30;

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is required');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL_CONFIGS = {
  polite: {
    model: 'openai/gpt-oss-20b',

    description: 'Fast and friendly responses'
  },
  concise: {
    model: 'llama-3.1-8b-instant',

    description: 'Direct and to-the-point answers'
  },
  versatile: {
    model: 'llama-3.3-70b-versatile',
    description: 'Balanced responses with good detail'
  },
  creative: {
    model: 'openai/gpt-oss-120b',
    description: 'Creative and engaging conversations'
  }
} as const;

type StyleOption = keyof typeof MODEL_CONFIGS;

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

    if (error.message.includes('401') || 
        error.message.includes('unauthorized') ||
        error.message.includes('API key')) {
      return {
        message: 'Authentication failed. Please check your API key configuration.',
        type: 'AUTH_ERROR',
        status: 401
      };
    }

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

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

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

  if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

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

async function createStreamingResponse(result: any): Promise<ReadableStream> {
  return new ReadableStream({
    async start(controller) {
      let totalChunks = 0;
      let totalText = '';

      try {
        for await (const chunk of result) {
          const chunkText = chunk.choices[0]?.delta?.content;
          if (chunkText && chunkText.trim()) {
            totalChunks++;
            totalText += chunkText;
            
            console.log(`[CHAT-API] Chunk ${totalChunks}: "${chunkText.substring(0, 100)}${chunkText.length > 100 ? '...' : ''}"`);

            const chunkData = JSON.stringify({ 
              text: chunkText,
              chunk: totalChunks 
            });
            controller.enqueue(new TextEncoder().encode(`data: ${chunkData}\n\n`));
          }
        }

        console.log(`[CHAT-API] Streaming complete. Total chunks: ${totalChunks}, Total text length: ${totalText.length}`);
        
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();

      } catch (streamError) {
        console.error('[CHAT-API] Streaming error:', streamError);
        const errorInfo = errorHandler(streamError);
        
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

    // Validate and set style option
    let selectedStyle: StyleOption = 'versatile'; // default
    if (body.style) {
      if (typeof body.style !== 'string' || !MODEL_CONFIGS[body.style as StyleOption]) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid style option. Available options: polite, concise, versatile, creative',
            type: 'VALIDATION_ERROR'
          }), 
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      selectedStyle = body.style as StyleOption;
    }

    const selectedModel = MODEL_CONFIGS[selectedStyle];

    console.log(`[CHAT-API] Processing ${validatedMessages.length} messages with style: ${selectedStyle} (${selectedModel.description})`);
    console.log(`[CHAT-API] Last message preview: "${validatedMessages[validatedMessages.length - 1].content.substring(0, 100)}..."`);

    // Initialize Groq model with error handling
    let model;
    try {
      model = groq; // Groq client is ready - model will be selected based on style
    } catch (modelError) {
      console.error('[CHAT-API] Failed to initialize Groq client:', modelError);
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

    // Convert messages to Groq format (include system prompt and all messages)
    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      { role: 'system' as const, content: SYSTEM_PROMPT.content },
      ...validatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    console.log(`[CHAT-API] Total messages for Groq: ${messages.length}`);

    console.log('[CHAT-API] Sending request to Groq API...');

    // Send message and get streaming response
    let result;
    try {
      result = await groq.chat.completions.create({
        model: selectedModel.model,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
        stream: true,
      });
    } catch (apiError) {
      console.error('[CHAT-API] Groq API error:', apiError);
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
    }    console.log('[CHAT-API] Creating streaming response...');

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
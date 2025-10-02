import Groq from 'groq-sdk';
import { SYSTEM_PROMPT } from './prompt';
import {
  createSuccessResponse,
  createErrorResponse,
  createStreamingChunk,
  createStreamingError,
  ERROR_TYPES,
  formatTimestamp,
  formatErrorMessage,
  validateMessageContent,
  type ApiResponse,
  type ErrorResponse,
  type StreamingChunk,
  type StreamingError
} from '@/lib/api-response-utils';

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

function errorHandler(error: unknown): { message: string; type: string; status: number } {
  if (error == null) {
    return {
      message: formatErrorMessage('An unknown error occurred'),
      type: ERROR_TYPES.UNKNOWN_ERROR,
      status: 500
    };
  }

  if (typeof error === 'string') {
    return {
      message: formatErrorMessage(error),
      type: ERROR_TYPES.UNKNOWN_ERROR,
      status: 500
    };
  }

  if (error instanceof Error) {
    if (error.message.includes('429') ||
        error.message.includes('Too Many Requests') ||
        error.message.includes('quota') ||
        error.message.toLowerCase().includes('resource has been exhausted')) {
      return {
        message: formatErrorMessage('API quota exceeded. Please try again tomorrow or upgrade your plan.'),
        type: ERROR_TYPES.QUOTA_EXCEEDED,
        status: 429
      };
    }

    if (error.message.includes('401') ||
        error.message.includes('unauthorized') ||
        error.message.includes('API key')) {
      return {
        message: formatErrorMessage('Authentication failed. Please check your API key configuration.'),
        type: ERROR_TYPES.AUTH_ERROR,
        status: 401
      };
    }

    if (error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('connection')) {
      return {
        message: formatErrorMessage('Network error. Please check your connection and try again.'),
        type: ERROR_TYPES.NETWORK_ERROR,
        status: 503
      };
    }

    return {
      message: formatErrorMessage(error.message),
      type: ERROR_TYPES.API_ERROR,
      status: 500
    };
  }

  return {
    message: formatErrorMessage('An unexpected error occurred'),
    type: ERROR_TYPES.UNKNOWN_ERROR,
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

function summarizeConversation(messages: Message[]): string {
  if (messages.length <= 2) return '';

  const recentMessages = messages.slice(-6); // Last 6 messages for context
  const topics = [];
  
  // Extract key topics from recent conversation
  const content = recentMessages.map(m => m.content).join(' ').toLowerCase();
  
  if (content.includes('tuneit') || content.includes('solo project')) topics.push('Tuneit project');
  if (content.includes('jobify') || content.includes('marvellex')) topics.push('Jobify/Marvellex work');
  if (content.includes('servifi')) topics.push('Servifi project');
  if (content.includes('talent-tube') || content.includes('talent tube')) topics.push('Talent-Tube project');
  if (content.includes('debug') || content.includes('bug')) topics.push('debugging experience');
  if (content.includes('learn') || content.includes('started')) topics.push('learning journey');
  if (content.includes('javascript') || content.includes('js')) topics.push('JavaScript');
  if (content.includes('react') || content.includes('next')) topics.push('React/Next.js');
  
  if (topics.length === 0) return '';
  
  return `Recent conversation topics: ${topics.join(', ')}. `;
}

function validateResponse(response: string, userQuery: string): boolean {
  const responseLower = response.toLowerCase();
  const queryLower = userQuery.toLowerCase();
  
  // Check if response is too generic or redirecting
  if (responseLower.includes('here to talk about my dev work') && 
      responseLower.includes('what would you like to know')) {
    return false; // Too generic redirect
  }
  
  // Check if response mentions key topics that should be covered
  const hasRelevantContent = 
    responseLower.includes('tuneit') ||
    responseLower.includes('jobify') ||
    responseLower.includes('servifi') ||
    responseLower.includes('javascript') ||
    responseLower.includes('react') ||
    responseLower.includes('next') ||
    responseLower.includes('debug') ||
    responseLower.includes('learn') ||
    responseLower.includes('work') ||
    responseLower.includes('project') ||
    responseLower.includes('code');
  
  return hasRelevantContent || response.length > 20; // Allow longer responses even if not directly relevant
}

function isStructuredResponseQuery(userQuery: string): 'skills' | 'resume' | 'projects' | 'experience' | null {
  const queryLower = userQuery.toLowerCase();

  // Check for skills-related queries
  const skillsKeywords = ['skills', 'hard skills', 'soft skills', 'technical skills', 'what are your skills', 'tell me about your skills', 'what skills do you have'];
  if (skillsKeywords.some(keyword => queryLower.includes(keyword))) {
    return 'skills';
  }

  // Check for resume/CV related queries
  const resumeKeywords = ['resume', 'cv', 'curriculum vitae', 'background', 'qualification', 'summary', 'about me', 'bio'];
  if (resumeKeywords.some(keyword => queryLower.includes(keyword))) {
    return 'resume';
  }

  // Check for projects-related queries
  const projectsKeywords = ['projects', 'work', 'portfolio', 'what have you built', 'what are your projects', 'show me your projects'];
  if (projectsKeywords.some(keyword => queryLower.includes(keyword))) {
    return 'projects';
  }

  // Check for experience-related queries
  const experienceKeywords = ['experience', 'job', 'work experience', 'professional experience', 'career'];
  if (experienceKeywords.some(keyword => queryLower.includes(keyword))) {
    return 'experience';
  }

  return null;
}

function formatStructuredResponse(fullText: string, responseType: 'skills' | 'resume' | 'projects' | 'experience'): string[] {
  const chunks: string[] = [];

  if (responseType === 'skills') {
    // Format skills as structured chunks with proper Markdown
    chunks.push('**Hard Skills:**');
    chunks.push('- JavaScript - My first programming language, very comfortable with it');
    chunks.push('- Node.js - For server-side development and APIs');
    chunks.push('- GraphQL - Prefer it over REST for exact data fetching');
    chunks.push('- Next.js - For building modern web applications');
    chunks.push('- React Native - For mobile app development');
    chunks.push('- MongoDB - My go-to database solution');
    chunks.push('- Socket.io - For real-time features');
    chunks.push('');  // Empty line for spacing
    chunks.push('**Soft Skills:**');
    chunks.push('- Problem-solving - Can tackle complex issues effectively');
    chunks.push('- Debugging - Systematic approach to finding and fixing bugs');
    chunks.push('- Fast learner - Quickly adapt to new technologies');
    chunks.push('- Strong focus - Maintain concentration during long coding sessions');
    chunks.push('- Clean code principles - Write maintainable, readable code');

  } else if (responseType === 'resume') {
    // Format resume as structured chunks
    chunks.push('**Professional Summary:**');
    chunks.push('16-year-old full-stack developer from Pakistan, currently working as a junior developer at Marvellex Softwares while completing high school.');
    chunks.push('');
    chunks.push('**Professional Experience:**');
    chunks.push('**Junior Developer** - Marvellex Softwares (Current)');
    chunks.push('- Developing Jobify platform connecting service providers with clients');
    chunks.push('- Complete backend development including APIs, databases, and real-time features');
    chunks.push('- Working on client projects and internal systems');
    chunks.push('');
    chunks.push('**Education:**');
    chunks.push('- High School Student');
    chunks.push('- Self-taught developer through online learning and practical projects');
    chunks.push('');
    chunks.push('**Technical Skills:**');
    chunks.push('- **Frontend:** React, Next.js, React Native');
    chunks.push('- **Backend:** Node.js, GraphQL, REST APIs');
    chunks.push('- **Database:** MongoDB');
    chunks.push('- **Real-time:** Socket.io');
    chunks.push('- **Tools:** VS Code, Git, Linux (Ubuntu)');

  } else if (responseType === 'projects') {
    // Format projects as structured chunks
    chunks.push('**Featured Projects:**');
    chunks.push('');
    chunks.push('**Tuneit** (Personal Project - In Development)');
    chunks.push('- Full-stack service platform connecting users with local services');
    chunks.push('- Tech: Next.js, React Native, Node.js, GraphQL, MongoDB');
    chunks.push('- Features: Service browsing, provider profiles, booking system, real-time notifications');
    chunks.push('- Status: Actively developing solo');
    chunks.push('');
    chunks.push('**Jobify** (Professional Project - Current)');
    chunks.push('- Platform connecting service providers with clients');
    chunks.push('- Tech: Next.js, Node.js, GraphQL, MongoDB, Socket.io');
    chunks.push('- Focus: Backend development, real-time features, dashboard design');
    chunks.push('https://jobifyy.com');
    chunks.push('');
    chunks.push('**Servifi** (Completed Project)');
    chunks.push('- Service platform linking providers with customers');
    chunks.push('- Tech: React, Node.js, MongoDB, Socket.io');
    chunks.push('- Built complete backend APIs, admin dashboards, real-time systems');
    chunks.push('https://nsevensecurity.com');
    chunks.push('');
    chunks.push('**Talent-Tube** (Professional Project)');
    chunks.push('- Real-time chat system for talent platform');
    chunks.push('- Tech: React, Socket.io, Node.js');
    chunks.push('- Led the complete chat system implementation');
    chunks.push('https://tt.mlxsoft.com/');
    chunks.push('');
    chunks.push('**GitHub Bot** (Personal Project)');
    chunks.push('- GitHub automation toolkit with AI assistance');
    chunks.push('- Tech: Node.js, GitHub API');
    chunks.push('https://github.com/sirajahmedx/bots');

  } else if (responseType === 'experience') {
    // Format experience as structured chunks
    chunks.push('**Work Experience:**');
    chunks.push('');
    chunks.push('**Junior Developer** - Marvellex Softwares');
    chunks.push('- *Duration:* Current position');
    chunks.push('- *Responsibilities:* Full-stack development, client project delivery');
    chunks.push('- *Key Achievements:* Successfully delivered multiple client projects, implemented real-time features');
    chunks.push('');
    chunks.push('**Freelance Developer**');
    chunks.push('- *Duration:* Ongoing');
    chunks.push('- *Focus:* Personal projects and learning new technologies');
    chunks.push('- *Notable Work:* Tuneit platform development, various client projects');
    chunks.push('');
    chunks.push('**Self-Learning Journey**');
    chunks.push('- Started coding in school, continued with self-study');
    chunks.push('- Primary learning resource: Hitesh Choudhary YouTube channel');
    chunks.push('- Focus: Practical application through building projects');
  }

  return chunks;
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

async function createStreamingResponse(result: any, userQuery: string, requestId: string): Promise<ReadableStream> {
  console.log(`[CHAT-API] ${requestId} - Starting streaming response creation`);
  const responseType = isStructuredResponseQuery(userQuery);

  return new ReadableStream({
    async start(controller) {
      let totalChunks = 0;
      let totalText = '';

      try {
        // First, collect the complete response
        for await (const chunk of result) {
          const chunkText = chunk.choices[0]?.delta?.content;
          if (chunkText && chunkText.trim()) {
            totalChunks++;
            totalText += chunkText;
          }
        }

        // Handle structured responses (skills/resume)
        if (responseType) {
          console.log(`[CHAT-API] ${requestId} - Detected ${responseType} query, formatting as structured response`);

          // Parse the complete response and format as structured chunks
          const structuredChunks = formatStructuredResponse(totalText, responseType);

          for (let i = 0; i < structuredChunks.length; i++) {
            const chunk = structuredChunks[i];
            const chunkData = {
              responseType,
              chunk: i,
              timestamp: formatTimestamp(),
              isComplete: i === structuredChunks.length - 1,
              text: chunk
            };

            console.log(`[CHAT-API] ${requestId} - Sending structured chunk ${i}: "${chunk.substring(0, 50)}${chunk.length > 50 ? '...' : ''}"`);
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`));
          }
        } else {
          // Handle normal streaming responses
          console.log(`[CHAT-API] ${requestId} - Normal response, streaming text chunks`);

          // For normal responses, simulate streaming by chunking the complete text
          const sentences = totalText.split(/[.!?]+/).filter(s => s.trim());
          let chunkIndex = 0;

          for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            if (sentence) {
              chunkIndex++;
              const chunkData = createStreamingChunk(sentence + (i < sentences.length - 1 ? '.' : ''), chunkIndex, i === sentences.length - 1);
              console.log(`[CHAT-API] ${requestId} - Sending chunk ${chunkIndex}: "${sentence.substring(0, 50)}${sentence.length > 50 ? '...' : ''}"`);
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`));
            }
          }

          // If no sentences were found, send the whole text as one chunk
          if (chunkIndex === 0 && totalText.trim()) {
            const chunkData = createStreamingChunk(totalText.trim(), 1, true);
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`));
          }
        }

        // Validate final response
        if (totalText && !validateResponse(totalText, userQuery)) {
          console.warn(`[CHAT-API] ${requestId} - Response validation failed, response may be off-topic`);
          // Could add fallback logic here in the future
        }

        console.log(`[CHAT-API] ${requestId} - Streaming complete. Total chunks: ${totalChunks}, total text length: ${totalText.length}`);
        controller.close();

      } catch (streamError) {
        console.error(`[CHAT-API] ${requestId} - Streaming error:`, streamError);
        const errorInfo = errorHandler(streamError);

        const errorData = createStreamingError(
          errorInfo.message,
          errorInfo.type as keyof typeof ERROR_TYPES,
          totalChunks
        );
        console.log(`[CHAT-API] ${requestId} - Sending streaming error:`, JSON.stringify(errorData, null, 2));
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorData)}\n\n`));
        controller.close();
      }
    }
  });
}export async function POST(req: Request) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[CHAT-API] ${requestId} - Starting POST request processing`);

  try {
    // Get client IP for rate limiting (with better IP detection)
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnecting = req.headers.get('cf-connecting-ip');
    const ip = cfConnecting || forwarded?.split(',')[0]?.trim() || realIP || 'unknown';

    console.log(`[CHAT-API] ${requestId} - Client IP: ${ip}`);

    // Check rate limiting
    if (isRateLimited(ip)) {
      console.log(`[CHAT-API] ${requestId} - Rate limit exceeded for IP: ${ip}`);
      const errorResponse = createErrorResponse(
        ERROR_TYPES.RATE_LIMIT_ERROR,
        'Rate limit exceeded. Please try again later.',
        { retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) }
      );
      console.log(`[CHAT-API] ${requestId} - Sending rate limit error response:`, JSON.stringify(errorResponse, null, 2));
      return new Response(
        JSON.stringify(errorResponse),
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
      console.log(`[CHAT-API] ${requestId} - Raw request body length: ${text.length}`);
      if (!text.trim()) {
        throw new Error('Empty request body');
      }
      body = JSON.parse(text);
      console.log(`[CHAT-API] ${requestId} - Parsed request body:`, {
        messagesCount: body.messages?.length || 0,
        style: body.style || 'default',
        hasMessages: !!body.messages
      });
    } catch (parseError) {
      console.error(`[CHAT-API] ${requestId} - Failed to parse request body:`, parseError);
      const errorResponse = createErrorResponse(
        ERROR_TYPES.PARSE_ERROR,
        'Invalid JSON in request body'
      );
      console.log(`[CHAT-API] ${requestId} - Sending parse error response:`, JSON.stringify(errorResponse, null, 2));
      return new Response(
        JSON.stringify(errorResponse),
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
      console.log(`[CHAT-API] ${requestId} - Validated ${validatedMessages.length} messages successfully`);
      validatedMessages.forEach((msg, i) => {
        console.log(`[CHAT-API] ${requestId} - Message ${i + 1}: role=${msg.role}, contentLength=${msg.content.length}`);
      });
    } catch (validationError) {
      console.error(`[CHAT-API] ${requestId} - Message validation failed:`, validationError);
      const errorResponse = createErrorResponse(
        ERROR_TYPES.VALIDATION_ERROR,
        validationError instanceof Error ? validationError.message : 'Invalid message format'
      );
      console.log(`[CHAT-API] ${requestId} - Sending validation error response:`, JSON.stringify(errorResponse, null, 2));
      return new Response(
        JSON.stringify(errorResponse),
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
        console.log(`[CHAT-API] ${requestId} - Invalid style option provided: ${body.style}`);
        const errorResponse = createErrorResponse(
          ERROR_TYPES.VALIDATION_ERROR,
          'Invalid style option. Available options: polite, concise, versatile, creative'
        );
        console.log(`[CHAT-API] ${requestId} - Sending style validation error response:`, JSON.stringify(errorResponse, null, 2));
        return new Response(
          JSON.stringify(errorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      selectedStyle = body.style as StyleOption;
    }

    const selectedModel = MODEL_CONFIGS[selectedStyle];
    console.log(`[CHAT-API] ${requestId} - Selected style: ${selectedStyle}, model: ${selectedModel.model}`);

    // Initialize Groq model with error handling
    let model;
    try {
      model = groq; // Groq client is ready - model will be selected based on style
    } catch (modelError) {
      console.error('[CHAT-API] Failed to initialize Groq client:', modelError);
      const errorInfo = errorHandler(modelError);
      const errorResponse = createErrorResponse(
        errorInfo.type as keyof typeof ERROR_TYPES,
        errorInfo.message
      );
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: errorInfo.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert messages to Groq format (include system prompt and all messages)
    const conversationSummary = summarizeConversation(validatedMessages);
    const systemPromptWithContext = conversationSummary
      ? SYSTEM_PROMPT.content + '\n\n' + conversationSummary
      : SYSTEM_PROMPT.content;

    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      { role: 'system' as const, content: systemPromptWithContext },
      ...validatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    console.log(`[CHAT-API] ${requestId} - Total messages for Groq: ${messages.length}`);
    console.log(`[CHAT-API] ${requestId} - Conversation summary: ${conversationSummary || 'none'}`);

    console.log(`[CHAT-API] ${requestId} - Sending request to Groq API with model: ${selectedModel.model}`);

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
      console.log(`[CHAT-API] ${requestId} - Groq API request successful, starting streaming response`);
    } catch (apiError) {
      console.error(`[CHAT-API] ${requestId} - Groq API error:`, apiError);
      const errorInfo = errorHandler(apiError);
      const errorResponse = createErrorResponse(
        errorInfo.type as keyof typeof ERROR_TYPES,
        errorInfo.message
      );
      console.log(`[CHAT-API] ${requestId} - Sending API error response:`, JSON.stringify(errorResponse, null, 2));
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: errorInfo.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create streaming response
    const lastUserMessage = validatedMessages[validatedMessages.length - 1];
    const userQuery = lastUserMessage ? lastUserMessage.content : '';
    console.log(`[CHAT-API] ${requestId} - Creating streaming response for user query: "${userQuery.substring(0, 100)}${userQuery.length > 100 ? '...' : ''}"`);
    const stream = await createStreamingResponse(result, userQuery, requestId);

    const processingTime = Date.now() - startTime;
    console.log(`[CHAT-API] ${requestId} - Request completed successfully in ${processingTime}ms`);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Processing-Time': processingTime.toString(),
        'X-Request-ID': requestId
      },
    });

  } catch (globalError) {
    const processingTime = Date.now() - startTime;
    console.error(`[CHAT-API] ${requestId || 'unknown'} - Global error:`, globalError);
    const errorInfo = errorHandler(globalError);

    const errorResponse = createErrorResponse(
      errorInfo.type as keyof typeof ERROR_TYPES,
      errorInfo.message,
      { processingTime }
    );

    console.log(`[CHAT-API] ${requestId || 'unknown'} - Sending global error response:`, JSON.stringify(errorResponse, null, 2));

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: errorInfo.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Processing-Time': processingTime.toString(),
          'X-Request-ID': requestId || 'unknown'
        }
      }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(req: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[CHAT-API] ${requestId} - Handling OPTIONS preflight request`);
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
      'X-Request-ID': requestId
    },
  });
}

// Simplified GET handler (keeping for backward compatibility but not recommended for production)
export async function GET(req: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[CHAT-API] ${requestId} - Handling deprecated GET request`);
  
  try {
    
    const url = new URL(req.url);
    const messagesParam = url.searchParams.get('messages');
    
    if (!messagesParam) {
      console.log(`[CHAT-API] ${requestId} - Missing messages parameter in GET request`);
      const errorResponse = createErrorResponse(
        ERROR_TYPES.VALIDATION_ERROR,
        'Messages parameter is required'
      );
      console.log(`[CHAT-API] ${requestId} - Sending missing parameter error:`, JSON.stringify(errorResponse, null, 2));
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        }
      );
    }

    let messages;
    try {
      messages = JSON.parse(decodeURIComponent(messagesParam));
      console.log(`[CHAT-API] ${requestId} - Parsed ${messages?.length || 0} messages from GET parameter`);
    } catch (parseError) {
      console.error(`[CHAT-API] ${requestId} - Failed to parse messages parameter:`, parseError);
      const errorResponse = createErrorResponse(
        ERROR_TYPES.PARSE_ERROR,
        'Invalid messages format in query parameter'
      );
      console.log(`[CHAT-API] ${requestId} - Sending parse error response:`, JSON.stringify(errorResponse, null, 2));
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        }
      );
    }

    // Redirect GET requests to use POST method
    console.log(`[CHAT-API] ${requestId} - Redirecting GET request to use POST method`);
    const errorResponse = createErrorResponse(
      ERROR_TYPES.METHOD_DEPRECATED,
      'GET method is deprecated. Please use POST method instead.',
      {
        recommendation: 'Use POST /api/chat with messages in the request body'
      }
    );
    console.log(`[CHAT-API] ${requestId} - Sending deprecation response:`, JSON.stringify(errorResponse, null, 2));
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'POST, OPTIONS',
          'X-Request-ID': requestId
        }
      }
    );

  } catch (error) {
    console.error(`[CHAT-API] ${requestId} - GET handler error:`, error);
    const errorInfo = errorHandler(error);
    
    const errorResponse = createErrorResponse(
      errorInfo.type as keyof typeof ERROR_TYPES,
      errorInfo.message
    );

    console.log(`[CHAT-API] ${requestId} - Sending GET handler error response:`, JSON.stringify(errorResponse, null, 2));

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: errorInfo.status,
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      }
    );
  }
}
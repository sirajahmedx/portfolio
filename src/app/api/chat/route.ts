import {
  createErrorResponse,
  createStreamingChunk,
  createStreamingError,
  ERROR_TYPES,
  formatErrorMessage,
  formatTimestamp
} from '@/lib/api-response-utils';
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

function isStructuredResponseQuery(userQuery: string): 'skills' | 'projects' | 'experience' | 'contact' | 'setup' | null {
  const queryLower = userQuery.toLowerCase();

  const skillsKeywords = ['skills', 'hard skills', 'soft skills', 'technical skills', 'what are your skills', 'tell me about your skills', 'what skills do you have', 'abilities', 'competencies'];
  if (skillsKeywords.some(keyword => queryLower.includes(keyword))) {
    return 'skills';
  }

  const projectsKeywords = ['projects', 'work', 'portfolio', 'what have you built', 'what are your projects', 'show me your projects', 'showcase', 'demos'];
  if (projectsKeywords.some(keyword => queryLower.includes(keyword))) {
    return 'projects';
  }

  const experienceKeywords = ['experience', 'job', 'work experience', 'professional experience', 'career', 'employment', 'work history'];
  if (experienceKeywords.some(keyword => queryLower.includes(keyword))) {
    return 'experience';
  }

  const contactKeywords = ['contact', 'reach out', 'get in touch', 'email', 'social media', 'github', 'instagram', 'discord', 'linkedin'];
  if (contactKeywords.some(keyword => queryLower.includes(keyword))) {
    return 'contact';
  }

  const setupKeywords = ['setup', 'computer', 'laptop', 'specs', 'hardware', 'development environment', 'machine'];
  if (setupKeywords.some(keyword => queryLower.includes(keyword))) {
    return 'setup';
  }

  return null;
}


function formatStructuredResponse(fullText: string, responseType: 'skills' | 'projects' | 'experience' | 'contact' | 'setup'): string[] {
  const chunks: string[] = [];

  if (responseType === 'skills') {
    chunks.push('Well, here\'s what I\'m good at:');
    chunks.push('');
    chunks.push('**Hard Skills:**');
    chunks.push('JavaScript — my comfort zone since day one. Pretty much where I started and still love it.');
    chunks.push('Node.js — for backend stuff and APIs. Use it daily at work.');
    chunks.push('GraphQL — way better than REST tbh. No over-fetching, just clean data.');
    chunks.push('Next.js — for web apps. Built this portfolio with it actually.');
    chunks.push('React Native — mobile development. Still learning the deeper stuff but getting there.');
    chunks.push('MongoDB — my go-to database. Just works.');
    chunks.push('Socket.io — when you need real-time features. Used it a lot in Talent-Tube.');
    chunks.push('Firebase — notifications and real-time data sync.');
    chunks.push('Stripe — payment integrations. Learned this through Servifi.');
    chunks.push('');
    chunks.push('**Soft Skills:**');
    chunks.push('Problem-solving — can tackle pretty complex stuff now.');
    chunks.push('Debugging — trace from error file upward, log everything. Takes time but works.');
    chunks.push('Fast learner — pick up new tech pretty quick.');
    chunks.push('Clean code — try to write stuff that makes sense later.');
    chunks.push('Focus — depends on the day. Sometimes 15 mins, sometimes an hour straight.');

  } else if (responseType === 'projects') {
    chunks.push('Here\'s what I\'ve been working on:');
    chunks.push('');
    chunks.push('**Tuneit** — my solo dream project');
    chunks.push('Building a platform to help people find trusted local mechanics. Doing everything solo — Next.js, Node.js, GraphQL, MongoDB, React Native.');
    chunks.push('It\'s my vision, so I\'m taking time to understand every part. Currently working on AI-powered search.');
    chunks.push('Status: actively building it. This is what I\'m most excited about.');
    chunks.push('Repos: web, api, and mobile — all on my GitHub @sirajahmedx');
    chunks.push('');
    chunks.push('**Jobify** — current work project');
    chunks.push('Platform where users hire talents like tradesmen and pros. I built all the dashboards and backend logic.');
    chunks.push('Rest of the team handles mobile and UI. It\'s live at jobifyy.com with 10k+ users.');
    chunks.push('My part: user auth, booking flow, real-time alerts, payment processing.');
    chunks.push('');
    chunks.push('**Talent-Tube** — completed at Marvellex');
    chunks.push('Like TikTok but for skills. Users post talents, others book them.');
    chunks.push('I built the full real-time chat system for the team. That\'s how users talk before booking.');
    chunks.push('Live at tt.mlxsoft.com if you wanna check it out.');
    chunks.push('');
    chunks.push('**Servifi** — client project I finished');
    chunks.push('Handyman service platform. I did backend, dashboards, APIs, and Stripe payment flow.');
    chunks.push('Everything\'s real-time with Firebase. Learned a lot from this one.');
    chunks.push('Live at nsevensecurity.com — 24/7 emergency services.');
    chunks.push('');
    chunks.push('**Sensify** — school project');
    chunks.push('React Native sensor app. Sensors + APIs were a pain, but I shipped it overnight.');
    chunks.push('Learned proper debugging with this one. Don\'t sleep till it\'s done, you know?');
    chunks.push('Available on my GitHub.');
    chunks.push('');
    chunks.push('**Global Parcel Services GPS** — first mobile app');
    chunks.push('GPS parcel tracker in React Native. My first mobile project.');
    chunks.push('Used AI for debugging geolocation stuff, but understood everything I shipped.');
    chunks.push('It\'s on Play Store if you search "Global Parcel Services".');

  } else if (responseType === 'experience') {
    chunks.push('Here\'s my dev journey so far:');
    chunks.push('');
    chunks.push('**Marvellex Softwares** — Junior Developer (Jan 2025 - present)');
    chunks.push('My brother referred me, I did the interview, been solid since.');
    chunks.push('Work remotely from home. Tasks come daily, I do them when I\'m free. Pretty chill setup.');
    chunks.push('No micromanagement — they trust me to get stuff done.');
    chunks.push('Focus: backend logic, APIs, dashboards, real-time systems.');
    chunks.push('');
    chunks.push('**How I got started:**');
    chunks.push('Started coding in school, kept learning at home. Follow Hitesh Choudhary — he\'s the OG.');
    chunks.push('When stuck, I ask ChatGPT — but only to learn, not copy blindly.');
    chunks.push('My motto: "Learn by doing, build by solving."');
    chunks.push('');
    chunks.push('**Work style:**');
    chunks.push('Code in complete silence — no music, just me and thoughts.');
    chunks.push('No fixed schedule. Code when I feel like it.');
    chunks.push('Don\'t sleep till the job\'s done. Been up till 5 AM before.');
    chunks.push('When frustrated? Scroll Instagram for a break.');

  } else if (responseType === 'contact') {
    chunks.push('Wanna get in touch? Here\'s how:');
    chunks.push('');
    chunks.push('**Email:** sirajahmedxdev@gmail.com — best for serious stuff');
    chunks.push('**GitHub:** @sirajahmedx — all my code\'s there');
    chunks.push('**Discord:** sirajahmedx — for quick chats');
    chunks.push('**Instagram:** @sirajahmedxdev — barely active these days');
    chunks.push('**LinkedIn:** working on it...');
    chunks.push('');
    chunks.push('**Current status:**');
    chunks.push('I\'m working at Marvellex and focused on Tuneit right now.');
    chunks.push('Not really free to debug random stuff, but email me if it\'s something specific.');
    chunks.push('If you\'ve got something interesting work-wise, shoot me a message.');

  } else if (responseType === 'setup') {
    chunks.push('Here\'s what I work with:');
    chunks.push('');
    chunks.push('**Hardware:**');
    chunks.push('Dell Latitude 7480 — Intel i7 6th gen, 24GB RAM, 256GB SSD');
    chunks.push('Gets the job done. Nothing fancy but reliable.');
    chunks.push('');
    chunks.push('**Software:**');
    chunks.push('Ubuntu — love Linux, way better than Windows for dev work');
    chunks.push('VS Code — my main editor, can\'t imagine using anything else');
    chunks.push('Default Ubuntu terminal — simple and works');
    chunks.push('Git + GitHub — for version control obviously');
    chunks.push('');
    chunks.push('**How I work:**');
    chunks.push('Complete silence when coding — no music, just random thoughts running');
    chunks.push('No fixed schedule — code when free and in the mood');
    chunks.push('Don\'t sleep till the task is done');
    chunks.push('When debugging: add logs everywhere, trace step by step');
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

        // Handle structured responses (skills/resume/projects/experience/contact/setup)
        if (responseType) {
          console.log(`[CHAT-API] ${requestId} - Detected ${responseType} query, formatting as structured response`);

          // Use predefined structured response instead of AI-generated content for consistency
          const structuredChunks = formatStructuredResponse('', responseType);

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

          // Improved chunking strategy for better readability
          if (totalText.trim()) {
            // Split by sentences but also respect paragraph breaks
            const paragraphs = totalText.split(/\n\s*\n/).filter(p => p.trim());
            let chunkIndex = 0;

            for (let i = 0; i < paragraphs.length; i++) {
              const paragraph = paragraphs[i].trim();
              if (paragraph) {
                // Further split long paragraphs by sentences
                const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim());
                
                for (let j = 0; j < sentences.length; j++) {
                  const sentence = sentences[j].trim();
                  if (sentence) {
                    chunkIndex++;
                    const punctuation = j === sentences.length - 1 && i === paragraphs.length - 1 ? '' : '.';
                    const chunkData = createStreamingChunk(
                      sentence + punctuation, 
                      chunkIndex, 
                      i === paragraphs.length - 1 && j === sentences.length - 1
                    );
                    console.log(`[CHAT-API] ${requestId} - Sending chunk ${chunkIndex}: "${sentence.substring(0, 50)}${sentence.length > 50 ? '...' : ''}"`);
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`));
                  }
                }
              }
            }

            // Fallback if no proper chunks were created
            if (chunkIndex === 0) {
              const chunkData = createStreamingChunk(totalText.trim(), 1, true);
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`));
            }
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
}

export async function POST(req: Request) {
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
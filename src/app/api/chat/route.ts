import {
  createErrorResponse,
  createStreamingChunk,
  createStreamingError,
  ERROR_TYPES,
  formatErrorMessage,
  formatTimestamp,
} from "@/lib/api-response-utils";
import Groq from "groq-sdk";
import { SYSTEM_PROMPT } from "./prompt";

export const maxDuration = 30;

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY environment variable is required");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL_CONFIGS = {
  polite: {
    model: "openai/gpt-oss-20b",
    description: "Fast and friendly responses",
  },
  concise: {
    model: "llama-3.1-8b-instant",
    description: "Direct and to-the-point answers",
  },
  versatile: {
    model: "llama-3.3-70b-versatile",
    description: "Balanced responses with good detail",
  },
  creative: {
    model: "openai/gpt-oss-120b",
    description: "Creative and engaging conversations",
  },
} as const;

type StyleOption = keyof typeof MODEL_CONFIGS;

function errorHandler(error: unknown): {
  message: string;
  type: string;
  status: number;
} {
  if (error == null) {
    return {
      message: formatErrorMessage("An unknown error occurred"),
      type: ERROR_TYPES.UNKNOWN_ERROR,
      status: 500,
    };
  }

  if (typeof error === "string") {
    return {
      message: formatErrorMessage(error),
      type: ERROR_TYPES.UNKNOWN_ERROR,
      status: 500,
    };
  }

  if (error instanceof Error) {
    if (
      error.message.includes("429") ||
      error.message.includes("Too Many Requests") ||
      error.message.includes("quota") ||
      error.message.toLowerCase().includes("resource has been exhausted")
    ) {
      return {
        message: formatErrorMessage(
          "API quota exceeded. Please try again tomorrow or upgrade your plan."
        ),
        type: ERROR_TYPES.QUOTA_EXCEEDED,
        status: 429,
      };
    }

    if (
      error.message.includes("401") ||
      error.message.includes("unauthorized") ||
      error.message.includes("API key")
    ) {
      return {
        message: formatErrorMessage(
          "Authentication failed. Please check your API key configuration."
        ),
        type: ERROR_TYPES.AUTH_ERROR,
        status: 401,
      };
    }

    if (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("connection")
    ) {
      return {
        message: formatErrorMessage(
          "Network error. Please check your connection and try again."
        ),
        type: ERROR_TYPES.NETWORK_ERROR,
        status: 503,
      };
    }

    return {
      message: formatErrorMessage(error.message),
      type: ERROR_TYPES.API_ERROR,
      status: 500,
    };
  }

  return {
    message: formatErrorMessage("An unexpected error occurred"),
    type: ERROR_TYPES.UNKNOWN_ERROR,
    status: 500,
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
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  id?: string;
}

function summarizeConversation(messages: Message[]): string {
  if (messages.length <= 2) return "";

  const recentMessages = messages.slice(-6); // Last 6 messages for context
  const topics = [];

  // Extract key topics from recent conversation
  const content = recentMessages
    .map((m) => m.content)
    .join(" ")
    .toLowerCase();

  if (content.includes("tuneit") || content.includes("solo project"))
    topics.push("Tuneit project");
  if (content.includes("jobify") || content.includes("marvellex"))
    topics.push("Jobify/Marvellex work");
  if (content.includes("servifi")) topics.push("Servifi project");
  if (content.includes("talent-tube") || content.includes("talent tube"))
    topics.push("Talent-Tube project");
  if (content.includes("debug") || content.includes("bug"))
    topics.push("debugging experience");
  if (content.includes("learn") || content.includes("started"))
    topics.push("learning journey");
  if (content.includes("javascript") || content.includes("js"))
    topics.push("JavaScript");
  if (content.includes("react") || content.includes("next"))
    topics.push("React/Next.js");

  if (topics.length === 0) return "";

  return `Recent conversation topics: ${topics.join(", ")}. `;
}

function validateResponse(response: string, userQuery: string): boolean {
  const responseLower = response.toLowerCase();
  const queryLower = userQuery.toLowerCase();

  // Check if response is too generic or redirecting
  if (
    responseLower.includes("here to talk about my dev work") &&
    responseLower.includes("what would you like to know")
  ) {
    return false; // Too generic redirect
  }

  // Check if response mentions key topics that should be covered
  const hasRelevantContent =
    responseLower.includes("tuneit") ||
    responseLower.includes("jobify") ||
    responseLower.includes("servifi") ||
    responseLower.includes("javascript") ||
    responseLower.includes("react") ||
    responseLower.includes("next") ||
    responseLower.includes("debug") ||
    responseLower.includes("learn") ||
    responseLower.includes("work") ||
    responseLower.includes("project") ||
    responseLower.includes("code");

  return hasRelevantContent || response.length > 20;
}

function isCasualGreeting(userQuery: string): boolean {
  const queryLower = userQuery.toLowerCase().trim();

  const greetingKeywords = [
    "hello",
    "hi",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "howdy",
    "greetings",
    "sup",
    "what's up",
    "whats up",
    "yo",
    "hiya",
  ];

  return (
    greetingKeywords.some(
      (keyword) =>
        queryLower === keyword ||
        queryLower.startsWith(keyword + " ") ||
        queryLower.startsWith(keyword + ",") ||
        queryLower.startsWith(keyword + "!")
    ) && queryLower.length < 50
  );
}

function generateGreetingResponse(): string {
  const greetings = [
    "Hey, what's up?",
    "Hi there, what's on your mind today?",
    "Hey! What would you like to know?",
    "Hello! How can I help you today?",
    "Hi! What's on your mind?",
  ];

  return greetings[Math.floor(Math.random() * greetings.length)];
}

function detectQueryType(userQuery: string): string | null {
  const queryLower = userQuery.toLowerCase();

  const skillsKeywords = [
    "skills",
    "hard skills",
    "soft skills",
    "technical skills",
    "what are your skills",
    "tell me about your skills",
    "what skills do you have",
    "abilities",
    "competencies",
  ];
  if (skillsKeywords.some((keyword) => queryLower.includes(keyword))) {
    return "skills";
  }

  const resumeKeywords = [
    "resume",
    "cv",
    "curriculum vitae",
    "background",
    "qualification",
    "summary",
    "about me",
    "bio",
    "profile",
  ];
  if (resumeKeywords.some((keyword) => queryLower.includes(keyword))) {
    return "resume";
  }

  const projectsKeywords = [
    "projects",
    "work",
    "portfolio",
    "what have you built",
    "what are your projects",
    "show me your projects",
    "showcase",
    "demos",
  ];
  if (projectsKeywords.some((keyword) => queryLower.includes(keyword))) {
    return "projects";
  }

  const experienceKeywords = [
    "experience",
    "job",
    "work experience",
    "professional experience",
    "career",
    "employment",
    "work history",
  ];
  if (experienceKeywords.some((keyword) => queryLower.includes(keyword))) {
    return "experience";
  }

  const contactKeywords = [
    "contact",
    "reach out",
    "get in touch",
    "email",
    "social media",
    "github",
    "instagram",
    "discord",
    "linkedin",
  ];
  if (contactKeywords.some((keyword) => queryLower.includes(keyword))) {
    return "contact";
  }

  const setupKeywords = [
    "setup",
    "computer",
    "laptop",
    "specs",
    "hardware",
    "development environment",
    "machine",
  ];
  if (setupKeywords.some((keyword) => queryLower.includes(keyword))) {
    return "setup";
  }

  return null;
}

function getStructuredResponseInstructions(queryType: string): string {
  const instructions = {
    skills: `
When discussing your skills, share them conversationally like you're explaining what you know and how you use it:

- Start with your overall tech journey and what drives your learning
- Talk about your key technologies naturally - explain why you like each one and how you apply it
- Group them loosely (like frontend tools, backend systems, databases, etc.) but don't force rigid categories
- For each skill, mention specific projects or experiences that highlight your experience
- Share your learning approach and how you stay current
- Keep the tone personal and reflective of your actual experience

Remember to maintain natural flow - use phrases like "I'm really comfortable with", "I've been using", "What I love about", "That's helped me with" to make it feel like real conversation.`,

    projects: `
When talking about your projects, share them like you're telling someone about your work and what you've built:

- Start with a brief overview of your project journey and what motivates you
- Describe each major project in a connected way - what problem it solves, your role, the tech involved, and the outcome
- Connect projects to show your growth or learning progression
- Include links naturally as part of the conversation (like "you can check it out at...")
- Highlight what made each project interesting or challenging to you personally
- Don't list them mechanically - weave them into a narrative about your development path

Use smooth transitions and keep it conversational, like you're sharing your portfolio with a friend.`,

    contact: `
When sharing contact information, be helpful and give context about how to reach you:

- Start with your preferred way to be contacted and why
- Explain your social media presence and how active you are on each platform
- Share your availability and typical response times
- Give guidance on what kinds of inquiries work best for email vs other channels
- Be clear about your current work situation and freelance availability
- Keep it approachable and personable

Make it feel like you're giving someone your contact info in a natural conversation.`,

    experience: `
When discussing your professional experience, share your journey like you're telling your story:

- Start with how you got into coding and your early experiences
- Talk about your current work at Marvellex - how you got there, what you do, your daily rhythm
- Share your work philosophy and habits that have shaped your approach
- Connect your experience to personal growth and future goals
- Mention key projects or achievements that highlight your development
- Keep it chronological but conversational, not like a resume

Use storytelling elements to make it engaging and authentic.`,

    setup: `
When describing your development setup, share it like you're showing someone your workspace:

- Start with your hardware and why it works for you
- Talk about your operating system choice and development environment
- Explain your tools and workflow preferences
- Share habits or quirks that make your setup unique
- Mention any future considerations or what you value in your setup
- Keep it personal and reflective of your actual preferences

Make it feel like a natural discussion about your tech environment.`,

    resume: `
When providing background information, share it like you're introducing yourself professionally but conversationally:

- Start with who you are, your current role, and your background
- Cover your professional experience, education, and key skills
- Highlight major projects and achievements
- Share your technical proficiency and work approach
- Keep it comprehensive but flowing naturally
- Use confident but approachable language

Structure it logically but maintain the personal touch throughout.`,
  };

  return instructions[queryType as keyof typeof instructions] || "";
}

function validateMessages(messages: any[]): Message[] {
  if (!Array.isArray(messages)) {
    throw new Error("Messages must be an array");
  }

  if (messages.length === 0) {
    throw new Error("At least one message is required");
  }

  return messages.map((msg, index) => {
    if (!msg || typeof msg !== "object") {
      throw new Error(
        `Invalid message format at index ${index}: must be an object`
      );
    }

    if (!msg.role || !["user", "assistant"].includes(msg.role)) {
      throw new Error(
        `Invalid role at index ${index}: must be 'user' or 'assistant'`
      );
    }

    if (!msg.content || typeof msg.content !== "string") {
      throw new Error(
        `Invalid content at index ${index}: must be a non-empty string`
      );
    }

    if (msg.content.trim().length === 0) {
      // Handle empty messages - convert to "what do you want to know?" query
      return {
        role: msg.role,
        content: msg.role === "user" ? "what do you want to know?" : msg.content.trim(),
        timestamp: msg.timestamp,
        id: msg.id,
      };
    }

    if (msg.content.length > 10000) {
      throw new Error(
        `Message too long at index ${index}: maximum 10,000 characters`
      );
    }

    return {
      role: msg.role,
      content: msg.content.trim(),
      timestamp: msg.timestamp,
      id: msg.id,
    };
  });
}

async function createStreamingResponse(
  result: any,
  userQuery: string,
  requestId: string
): Promise<ReadableStream> {
  // Check for casual greetings first
  if (isCasualGreeting(userQuery)) {
    return new ReadableStream({
      start(controller) {
        const greetingResponse = generateGreetingResponse();

        const chunkData = {
          text: greetingResponse,
          isComplete: true,
          chunk: 1,
          totalChunks: 1,
          showProjectsButton: false,
        };

        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`)
        );
        controller.close();
      },
    });
  }

  return new ReadableStream({
    async start(controller) {
      let chunkIndex = 0;
      let totalText = "";
      let currentSentence = "";

      try {
        for await (const chunk of result) {
          const chunkText = chunk.choices[0]?.delta?.content;

          if (chunkText) {
            totalText += chunkText;
            currentSentence += chunkText;

            // Stream in smaller, more natural chunks (by sentence or line break)
            const sentences = currentSentence.split(/([.!?\n]+)/);

            // Process complete sentences, keep incomplete one in buffer
            for (let i = 0; i < sentences.length - 1; i += 2) {
              const sentence = sentences[i];
              const punctuation = sentences[i + 1] || "";

              if (sentence.trim()) {
                chunkIndex++;
                const fullSentence = sentence + punctuation;

                const chunkData = createStreamingChunk(
                  fullSentence,
                  chunkIndex,
                  false
                );

                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify(chunkData)}\n\n`
                  )
                );
              }
            }

            // Keep the last incomplete sentence in buffer
            currentSentence = sentences[sentences.length - 1] || "";
          }
        }

        // Send any remaining text with semantic analysis
        if (currentSentence.trim()) {
          chunkIndex++;
          const chunkData = createStreamingChunk(
            currentSentence.trim(),
            chunkIndex,
            true,
            totalText // Pass full text for semantic analysis
          );
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`)
          );
        } else if (chunkIndex > 0) {
          // Mark the last sent chunk as complete with semantic analysis
          const finalChunk = createStreamingChunk(
            "",
            chunkIndex,
            true,
            totalText
          );
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(finalChunk)}\n\n`)
          );
        }

        // Validate final response
        if (totalText && !validateResponse(totalText, userQuery)) {
        }

        controller.close();
      } catch (streamError) {
        const errorInfo = errorHandler(streamError);

        const errorData = createStreamingError(
          errorInfo.message,
          errorInfo.type as keyof typeof ERROR_TYPES,
          chunkIndex
        );
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(errorData)}\n\n`)
        );
        controller.close();
      }
    },
  });
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Get client IP for rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const realIP = req.headers.get("x-real-ip");
    const cfConnecting = req.headers.get("cf-connecting-ip");
    const ip =
      cfConnecting || forwarded?.split(",")[0]?.trim() || realIP || "unknown";

    // Check rate limiting
    if (isRateLimited(ip)) {
      const errorResponse = createErrorResponse(
        ERROR_TYPES.RATE_LIMIT_ERROR,
        "Rate limit exceeded. Please try again later.",
        { retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) }
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(RATE_LIMIT_WINDOW_MS / 1000).toString(),
        },
      });
    }

    // Parse and validate request body
    let body;
    try {
      const text = await req.text();
      if (!text.trim()) {
        throw new Error("Empty request body");
      }
      body = JSON.parse(text);
    } catch (parseError) {
      const errorResponse = createErrorResponse(
        ERROR_TYPES.PARSE_ERROR,
        "Invalid JSON in request body"
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate messages
    let validatedMessages: Message[];
    try {
      validatedMessages = validateMessages(body.messages);
    } catch (validationError) {
      const errorResponse = createErrorResponse(
        ERROR_TYPES.VALIDATION_ERROR,
        validationError instanceof Error
          ? validationError.message
          : "Invalid message format"
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate and set style option
    let selectedStyle: StyleOption = "versatile";
    if (body.style) {
      if (
        typeof body.style !== "string" ||
        !MODEL_CONFIGS[body.style as StyleOption]
      ) {
        const errorResponse = createErrorResponse(
          ERROR_TYPES.VALIDATION_ERROR,
          "Invalid style option. Available options: polite, concise, versatile, creative"
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      selectedStyle = body.style as StyleOption;
    }

    const selectedModel = MODEL_CONFIGS[selectedStyle];

    // Detect query type and add structured response instructions if needed
    const lastUserMessage = validatedMessages[validatedMessages.length - 1];
    const userQuery = lastUserMessage ? lastUserMessage.content : "";

    // Handle empty messages
    if (!userQuery.trim()) {
      return new Response(
        new ReadableStream({
          start(controller) {
            const chunkData = {
              text: "what do you want to know?",
              isComplete: true,
              chunk: 1,
              totalChunks: 1,
              showProjectsButton: false,
            };
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`)
            );
            controller.close();
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const queryType = detectQueryType(userQuery);

    // Build conversation context
    const conversationSummary = summarizeConversation(validatedMessages);
    let systemPromptWithContext = conversationSummary
      ? SYSTEM_PROMPT.content + "\n\n" + conversationSummary
      : SYSTEM_PROMPT.content;

    // Add structured response instructions for specific query types
    if (queryType) {
      const structuredInstructions =
        getStructuredResponseInstructions(queryType);
      systemPromptWithContext += "\n\n" + structuredInstructions;
    }

    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      { role: "system" as const, content: systemPromptWithContext },
      ...validatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

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
      const errorInfo = errorHandler(apiError);
      const errorResponse = createErrorResponse(
        errorInfo.type as keyof typeof ERROR_TYPES,
        errorInfo.message
      );
      return new Response(JSON.stringify(errorResponse), {
        status: errorInfo.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create streaming response
    const stream = await createStreamingResponse(result, userQuery, requestId);

    const processingTime = Date.now() - startTime;

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "X-Processing-Time": processingTime.toString(),
        "X-Request-ID": requestId,
      },
    });
  } catch (globalError) {
    const processingTime = Date.now() - startTime;
    const errorInfo = errorHandler(globalError);

    const errorResponse = createErrorResponse(
      errorInfo.type as keyof typeof ERROR_TYPES,
      errorInfo.message,
      { processingTime }
    );

    return new Response(JSON.stringify(errorResponse), {
      status: errorInfo.status,
      headers: {
        "Content-Type": "application/json",
        "X-Processing-Time": processingTime.toString(),
        "X-Request-ID": requestId || "unknown",
      },
    });
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(req: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "X-Request-ID": requestId,
    },
  });
}

// GET handler (deprecated)
export async function GET(req: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const errorResponse = createErrorResponse(
    ERROR_TYPES.METHOD_DEPRECATED,
    "GET method is deprecated. Please use POST method instead.",
    {
      recommendation: "Use POST /api/chat with messages in the request body",
    }
  );

  return new Response(JSON.stringify(errorResponse), {
    status: 405,
    headers: {
      "Content-Type": "application/json",
      Allow: "POST, OPTIONS",
      "X-Request-ID": requestId,
    },
  });
}

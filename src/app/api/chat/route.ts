import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from './prompt';
import { getContact } from './tools/getContact';
import { getCrazy } from './tools/getCrazy';
import { getInternship } from './tools/getIntership';
import { getPresentation } from './tools/getPresentation';
import { getProjects } from './tools/getProjects';
import { getResume } from './tools/getResume';
import { getSkills } from './tools/getSkills';
import { getSports } from './tools/getSport';

export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ❌ Pas besoin de l'export ici, Next.js n'aime pas ça
function errorHandler(error: unknown) {
  if (error == null) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    // Check for quota exceeded error
    if (error.message.includes('429') || error.message.includes('Too Many Requests') || error.message.includes('quota')) {
      return 'QUOTA_EXCEEDED: You have exceeded your daily API quota. Please try again tomorrow or upgrade your plan.';
    }
    return error.message;
  }
  return JSON.stringify(error);
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('[CHAT-API] Incoming messages count:', messages.length);
    console.log('[CHAT-API] Full messages:', JSON.stringify(messages, null, 2));

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert ALL messages to Gemini format for proper conversation context
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    console.log('[CHAT-API] History for context:', JSON.stringify(history, null, 2));

    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const lastMessage = messages[messages.length - 1];
    console.log('[CHAT-API] Last message to respond to:', lastMessage.content);

    const prompt = `${SYSTEM_PROMPT.content}\n\nUser: ${lastMessage.content}`;
    console.log('[CHAT-API] Full prompt being sent to Gemini:', prompt.substring(0, 200) + '...');

    const result = await chat.sendMessageStream(prompt);
    console.log('[CHAT-API] Starting streaming response...');

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let totalChunks = 0;
          let totalText = '';

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              totalChunks++;
              totalText += chunkText;
              console.log(`[CHAT-API] Chunk ${totalChunks}: "${chunkText}"`);

              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
            }
          }

          console.log(`[CHAT-API] Streaming complete. Total chunks: ${totalChunks}, Total text length: ${totalText.length}`);
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[CHAT-API] Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[CHAT-API] Global error:', err);
    const errorMessage = errorHandler(err);

    // Return specific status for quota exceeded
    if (errorMessage.startsWith('QUOTA_EXCEEDED:')) {
      return new Response(errorMessage, { status: 429 });
    }

    return new Response(errorMessage, { status: 500 });
  }
}

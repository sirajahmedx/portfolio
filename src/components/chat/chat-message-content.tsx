"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ExpandableText from "@/components/ui/expandable-text";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  SemanticChunkRenderer,
  FallbackRenderer,
} from "./semantic-chunk-renderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  parts?: any[];
}

export type ChatMessageContentProps = {
  message: Message;
  isLast?: boolean;
  isLoading?: boolean;
  reload?: () => Promise<string | null | undefined>;
  skipToolRendering?: boolean;
  showProjectsButton?: boolean;
  isGreeting?: boolean; // New prop to indicate if this is a greeting response
};

const CodeBlock = ({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(true);

  const firstLineBreak = content.indexOf("\n");
  const firstLine = content.substring(0, firstLineBreak).trim();
  const language = firstLine || "text";
  const code = firstLine ? content.substring(firstLineBreak + 1) : content;

  const previewLines = code.split("\n").slice(0, 1).join("\n");
  const hasMoreLines = code.split("\n").length > 1;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="my-4 w-full overflow-hidden rounded-md"
    >
      <div className="bg-secondary text-secondary-foreground flex items-center justify-between rounded-t-md border-b px-4 py-1">
        <span className="text-sm">
          {language !== "text" ? language : "Code"}
        </span>
        <CollapsibleTrigger className="hover:bg-secondary/80 rounded p-1">
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
      </div>

      <div className="bg-accent/80 text-accent-foreground rounded-b-md">
        {!isOpen && hasMoreLines ? (
          <pre className="px-4 py-3">
            <code className="text-sm md:text-base leading-relaxed">
              {previewLines + "\n..."}
            </code>
          </pre>
        ) : (
          <CollapsibleContent>
            <div className="custom-scrollbar" style={{ overflowX: "auto" }}>
              <pre className="min-w-max px-4 py-3">
                <code className="text-sm md:text-base whitespace-pre leading-relaxed">
                  {code}
                </code>
              </pre>
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
};

// Function to split text into readable paragraphs
const splitIntoParagraphs = (text: string): string[] => {
  if (!text) return [];

  // First, split by existing double line breaks (paragraphs)
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  // Process each paragraph to break up long ones
  const processedParagraphs: string[] = [];

  paragraphs.forEach((paragraph) => {
    const trimmed = paragraph.trim();

    // If paragraph is short, keep as is
    if (trimmed.length < 200) {
      processedParagraphs.push(trimmed);
      return;
    }

    // Split long paragraphs at sentence boundaries
    const sentences = trimmed.split(/(?<=[.!?])\s+/);

    let currentParagraph = "";
    let sentenceCount = 0;

    sentences.forEach((sentence, index) => {
      currentParagraph += (currentParagraph ? " " : "") + sentence;
      sentenceCount++;

      // Break after 2-3 sentences or when reaching ~150 characters
      const shouldBreak =
        sentenceCount >= 2 &&
        (currentParagraph.length > 120 ||
          (sentenceCount >= 3 && currentParagraph.length > 80) ||
          index === sentences.length - 1);

      if (shouldBreak) {
        processedParagraphs.push(currentParagraph.trim());
        currentParagraph = "";
        sentenceCount = 0;
      }
    });

    // Add any remaining content
    if (currentParagraph.trim()) {
      processedParagraphs.push(currentParagraph.trim());
    }
  });

  return processedParagraphs.filter((p) => p.length > 0);
};

export default function ChatMessageContent({
  message,
  showProjectsButton = false,
}: ChatMessageContentProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const renderContent = () => {
    // Check if this is a casual greeting response
    const isGreetingResponse =
      message.role === "assistant" &&
      (message.content.toLowerCase().includes("hey") ||
        message.content.toLowerCase().includes("hi") ||
        message.content.toLowerCase().includes("what's up") ||
        message.content.toLowerCase().includes("what's on your mind"));

    // Check if response should show projects button
    const shouldShowProjectsButton =
      message.role === "assistant" &&
      (message.content.includes("[SHOW_PROJECTS_BUTTON]") ||
        message.content.toLowerCase().includes("tuneit") ||
        message.content.toLowerCase().includes("jobify") ||
        message.content.toLowerCase().includes("servifi") ||
        message.content.toLowerCase().includes("talent-tube") ||
        message.content.toLowerCase().includes("sensify") ||
        message.content.toLowerCase().includes("global parcel"));

    // Remove the marker from display
    const displayContent = message.content
      .replace("[SHOW_PROJECTS_BUTTON]", "")
      .trim();

    // Capitalize first letter for assistant responses
    const processedContent =
      message.role === "assistant" && displayContent.length > 0
        ? displayContent.charAt(0).toUpperCase() + displayContent.slice(1)
        : displayContent;

    // If semantic chunks are attached to the message (from streaming analysis), render them
    // message.metadata?.semantic?.chunks is expected shape
    // @ts-ignore - runtime check below
    const semantic = (message as any).metadata?.semantic;

    if (
      semantic &&
      Array.isArray(semantic.chunks) &&
      semantic.chunks.length > 0
    ) {
      return (
        <div className="w-full">
          <SemanticChunkRenderer chunks={semantic.chunks} />
          {shouldShowProjectsButton && message.role === "assistant" && (
            <div className="mt-4">
              <Button
                onClick={() => (window.location.href = "/projects")}
                className="flex items-center gap-2"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4" />
                View Projects
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (message.parts && message.parts.length > 0) {
      const content = message.parts.map((part, partIndex) => {
        if (part.type !== "text" || !part.text) return null;

        const contentParts = part.text.split("```");

        return (
          <div key={partIndex} className="w-full space-y-4">
            {contentParts.map((content: string, i: number) =>
              i % 2 === 0 ? (
                <div
                  key={`text-${i}`}
                  className="prose dark:prose-invert w-full"
                >
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p
                          className={`break-words whitespace-pre-wrap leading-relaxed text-sm md:text-base`}
                        >
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="my-3 md:my-4 list-disc pl-4 md:pl-6 text-sm md:text-base leading-relaxed">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="my-3 md:my-4 list-decimal pl-4 md:pl-6 text-sm md:text-base leading-relaxed">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="my-2 text-sm md:text-base leading-relaxed">
                          {children}
                        </li>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {content}
                  </Markdown>
                </div>
              ) : (
                <CodeBlock key={`code-${i}`} content={content} />
              )
            )}
          </div>
        );
      });

      return (
        <div className="w-full space-y-4">
          {content}
          {shouldShowProjectsButton && message.role === "assistant" && (
            <div className="mt-4">
              <Button
                onClick={() => (window.location.href = "/projects")}
                className="flex items-center gap-2"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4" />
                View My Projects
              </Button>
            </div>
          )}
        </div>
      );
    }
    if (message.content) {
      const contentParts = processedContent.split("```");

      const content = (
        <div className="w-full space-y-4">
          {contentParts.map((content: string, i: number) =>
            i % 2 === 0 ? (
              <div key={`text-${i}`} className="prose dark:prose-invert w-full">
                {isMobile ? (
                  <div className="space-y-3">
                    {splitIntoParagraphs(content).map((paragraph, pIndex) => (
                      <ExpandableText
                        key={`mobile-para-${pIndex}`}
                        text={paragraph}
                        maxLines={8}
                        mobileMaxLines={10}
                        className={`break-words whitespace-pre-wrap leading-relaxed text-sm md:text-base`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {splitIntoParagraphs(content).map((paragraph, pIndex) => (
                      <Markdown
                        key={`para-${pIndex}`}
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p
                              className={`break-words whitespace-pre-wrap leading-relaxed text-sm md:text-base`}
                            >
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="my-3 md:my-4 list-disc pl-4 md:pl-6 text-sm md:text-base leading-relaxed">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-3 md:my-4 list-decimal pl-4 md:pl-6 text-sm md:text-base leading-relaxed">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="my-2 text-sm md:text-base leading-relaxed">
                              {children}
                            </li>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {paragraph}
                      </Markdown>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <CodeBlock key={`code-${i}`} content={content} />
            )
          )}
        </div>
      );

      return (
        <div className="w-full space-y-4">
          {content}
          {shouldShowProjectsButton && message.role === "assistant" && (
            <div className="mt-4">
              <Button
                onClick={() => (window.location.href = "/projects")}
                className="flex items-center gap-2"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4" />
                View My Projects
              </Button>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const content = renderContent();

  return (
    <div
      className={`${
        message.role === "user" ? "w-auto max-w-full" : "w-full"
      } max-w-none`}
    >
      {content}
    </div>
  );
}

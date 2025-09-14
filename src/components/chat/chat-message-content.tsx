"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

// Custom Message interface
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
  addToolResult?: (args: { toolCallId: string; result: string }) => void;
  skipToolRendering?: boolean;
};

const CodeBlock = ({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Extract language if present in the first line
  const firstLineBreak = content.indexOf("\n");
  const firstLine = content.substring(0, firstLineBreak).trim();
  const language = firstLine || "text";
  const code = firstLine ? content.substring(firstLineBreak + 1) : content;

  // Get first few lines for preview
  const previewLines = code.split("\n").slice(0, 1).join("\n");
  const hasMoreLines = code.split("\n").length > 1;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="my-4 w-full overflow-hidden rounded-md"
    >
      <div className="bg-secondary text-secondary-foreground flex items-center justify-between rounded-t-md border-b px-4 py-1">
        <span className="text-xs">
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
            <code className="text-xs md:text-sm leading-relaxed">
              {previewLines + "\n..."}
            </code>
          </pre>
        ) : (
          <CollapsibleContent>
            <div className="custom-scrollbar" style={{ overflowX: "auto" }}>
              <pre className="min-w-max px-4 py-3">
                <code className="text-xs md:text-sm whitespace-pre leading-relaxed">
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

export default function ChatMessageContent({
  message,
}: ChatMessageContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle both parts-based and direct content messages
  const renderContent = () => {
    // Check if the message mentions projects
    const mentionsProjects =
      message.role === "assistant" &&
      (message.content.toLowerCase().includes("project") ||
        message.content.toLowerCase().includes("work") ||
        message.content.toLowerCase().includes("portfolio") ||
        message.content.toLowerCase().includes("jobify") ||
        message.content.toLowerCase().includes("tradesman") ||
        message.content.toLowerCase().includes("talent-tube") ||
        message.content.toLowerCase().includes("tuneit") ||
        message.content.toLowerCase().includes("github bot") ||
        message.content.toLowerCase().includes("sensify"));

    // If message has parts, use the parts-based rendering
    if (message.parts && message.parts.length > 0) {
      const content = message.parts.map((part, partIndex) => {
        if (part.type !== "text" || !part.text) return null;

        // Split content by code block markers
        const contentParts = part.text.split("```");

        return (
          <div key={partIndex} className="w-full space-y-4">
            {contentParts.map((content: string, i: number) =>
              i % 2 === 0 ? (
                // Regular text content
                <div
                  key={`text-${i}`}
                  className="prose dark:prose-invert w-full"
                >
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="break-words whitespace-pre-wrap text-xs md:text-base leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="my-3 md:my-4 list-disc pl-4 md:pl-6 text-xs md:text-base leading-relaxed">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="my-3 md:my-4 list-decimal pl-4 md:pl-6 text-xs md:text-base leading-relaxed">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="my-2 text-xs md:text-base leading-relaxed">
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
                // Code block content
                <CodeBlock key={`code-${i}`} content={content} />
              )
            )}
          </div>
        );
      });

      return (
        <div className="w-full space-y-4">
          {content}
          {/* {mentionsProjects && (
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
          )} */}
        </div>
      );
    } // If no parts but has direct content, render it directly
    if (message.content) {
      const contentParts = message.content.split("```");

      const content = (
        <div className="w-full space-y-4">
          {contentParts.map((content: string, i: number) =>
            i % 2 === 0 ? (
              // Regular text content
              <div key={`text-${i}`} className="prose dark:prose-invert w-full">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="break-words whitespace-pre-wrap text-xs md:text-base leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="my-3 md:my-4 list-disc pl-4 md:pl-6 text-xs md:text-base leading-relaxed">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-3 md:my-4 list-decimal pl-4 md:pl-6 text-xs md:text-base leading-relaxed">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="my-2 text-xs md:text-base leading-relaxed">
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
              // Code block content
              <CodeBlock key={`code-${i}`} content={content} />
            )
          )}
        </div>
      );

      return (
        <div className="w-full space-y-4">
          {content}
          {/* {mentionsProjects && (
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
          )} */}
        </div>
      );
    }

    return null;
  };

  const content = renderContent();

  // Check if content is long and needs truncation
  const shouldTruncate = message.content && message.content.length > 500;
  const truncatedContent =
    shouldTruncate && !isExpanded
      ? message.content.substring(0, 500) + "..."
      : message.content;

  return (
    <div className="w-full">
      {content}
      {shouldTruncate && (
        <div className="mt-4 text-center">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {isExpanded ? "View Less" : "View More"}
          </Button>
        </div>
      )}
    </div>
  );
}

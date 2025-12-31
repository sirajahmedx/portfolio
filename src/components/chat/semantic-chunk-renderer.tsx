"use client";

import React from "react";
import { TextChunk, getChunkStyles, ChunkType } from "@/lib/text-chunker";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SemanticChunkRendererProps {
  chunks: TextChunk[];
  className?: string;
  animateIn?: boolean;
  baseSize?: number;
}

export function SemanticChunkRenderer({
  chunks,
  className,
  animateIn = true,
  baseSize = 13.5,
}: SemanticChunkRendererProps) {
  if (!chunks || chunks.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-1", className)}>
      <AnimatePresence>
        {chunks.map((chunk, index) => (
          <ChunkComponent
            key={chunk.id}
            chunk={chunk}
            index={index}
            animateIn={animateIn}
            baseSize={baseSize}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ChunkComponentProps {
  chunk: TextChunk;
  index: number;
  animateIn: boolean;
  baseSize: number;
}

function ChunkComponent({
  chunk,
  index,
  animateIn,
  baseSize,
}: ChunkComponentProps) {
  const chunkStyles = getChunkStyles(chunk, baseSize);

  const motionProps = animateIn
    ? {
        initial: { opacity: 0, y: 10 } as const,
        animate: { opacity: 1, y: 0 } as const,
        transition: {
          delay: index * 0.1,
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1], // cubic-bezier for easeOut
        } as any,
      }
    : {};

  return (
    <motion.div
      {...motionProps}
      className={cn(
        "semantic-chunk",
        chunkStyles,
        getTypeSpecificClasses(chunk.type)
      )}
    >
      <ChunkContent chunk={chunk} />
      {chunk.metadata?.hasFollowUp && (
        <div className="w-2 h-2 bg-current opacity-30 rounded-full ml-1 inline-block" />
      )}
    </motion.div>
  );
}

function ChunkContent({ chunk }: { chunk: TextChunk }) {
  switch (chunk.type) {
    case "heading":
      return <HeadingChunk chunk={chunk} />;
    case "code-block":
      return <CodeChunk chunk={chunk} />;
    case "list-item":
      return <ListChunk chunk={chunk} />;
    case "quote":
      return <QuoteChunk chunk={chunk} />;
    case "table":
      return <TableChunk chunk={chunk} />;
    case "emphasis":
      return <EmphasisChunk chunk={chunk} />;
    default:
      return <ParagraphChunk chunk={chunk} />;
  }
}

function HeadingChunk({ chunk }: { chunk: TextChunk }) {
  const level = chunk.metadata?.headingLevel || 1;
  const tagName = `h${Math.min(6, level + 1)}`;
  const HeadingTag = tagName as React.ElementType;

  return (
    <HeadingTag className="text-foreground font-bold tracking-tight">
      {chunk.content}
    </HeadingTag>
  );
}

function CodeChunk({ chunk }: { chunk: TextChunk }) {
  const language = chunk.metadata?.codeLanguage || "text";

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 text-xs text-muted-foreground">
        {language}
      </div>
      <pre className="overflow-x-auto">
        <code className="text-sm">{chunk.content}</code>
      </pre>
    </div>
  );
}

function ListChunk({ chunk }: { chunk: TextChunk }) {
  const level = chunk.metadata?.listLevel || 0;
  const indent = level * 16; // 16px per level

  return (
    <div
      className="flex items-start gap-2"
      style={{ paddingLeft: `${indent}px` }}
    >
      <span className="text-muted-foreground mt-1 text-sm">•</span>
      <span className="flex-1">
        {chunk.content.replace(/^[\s]*[-*+•]\s*/, "")}
      </span>
    </div>
  );
}

function QuoteChunk({ chunk }: { chunk: TextChunk }) {
  return (
    <blockquote className="border-l-4 border-muted pl-4 italic text-muted-foreground">
      {chunk.content.replace(/^>\s*/, "")}
    </blockquote>
  );
}

function TableChunk({ chunk }: { chunk: TextChunk }) {
  const rows = chunk.content.split("\n").filter((row) => row.includes("|"));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-muted/30">
              {row
                .split("|")
                .filter((cell) => cell.trim())
                .map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-2 py-1 border-r border-muted/20 last:border-r-0"
                  >
                    {cell.trim()}
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmphasisChunk({ chunk }: { chunk: TextChunk }) {
  return (
    <span className="font-semibold text-accent-foreground">
      {chunk.content}
    </span>
  );
}

function ParagraphChunk({ chunk }: { chunk: TextChunk }) {
  return <p className="text-foreground leading-relaxed">{chunk.content}</p>;
}

function getTypeSpecificClasses(type: ChunkType): string {
  const classes: Record<ChunkType, string> = {
    heading: "mb-4 mt-6 first:mt-0 text-sm", // More spacing above headings
    paragraph: "mb-3 text-justify text-sm leading-relaxed", // Smaller font, more spacing
    "list-item": "mb-2 text-sm", // More spacing between list items
    "code-block": "mb-4 rounded-md bg-muted/50 p-3 font-mono text-xs", // Smaller code font
    quote: "mb-4 my-3 text-sm",
    table: "mb-4 text-xs", // Keep tables but make them smaller
    emphasis: "mb-2 text-sm font-medium",
    transition: "mb-3 text-muted-foreground text-sm",
  };

  return classes[type] || "";
}

// Fallback component for when semantic chunking fails
export function FallbackRenderer({
  content,
  className,
  baseSize = 13.5,
}: {
  content: string;
  className?: string;
  baseSize?: number;
}) {
  const fontSize = Math.max(10, baseSize * 0.75); // 25% reduction for fallback

  return (
    <div
      className={cn("prose prose-sm max-w-none", className)}
      style={{ fontSize: `${fontSize}px` }}
    >
      {content.split("\n\n").map((paragraph, index) => (
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className="mb-3 leading-relaxed text-foreground text-sm"
        >
          {paragraph.trim()}
        </motion.p>
      ))}
    </div>
  );
}

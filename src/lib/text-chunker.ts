// Dynamic text chunking utility for semantic content analysis and formatting
// Analyzes response structure and creates meaningful chunks for better readability

export interface TextChunk {
  id: string;
  content: string;
  type: ChunkType;
  weight: FontWeight;
  spacing: SpacingLevel;
  metadata?: ChunkMetadata;
}

export type ChunkType =
  | "heading"
  | "paragraph"
  | "list-item"
  | "code-block"
  | "quote"
  | "table"
  | "emphasis"
  | "transition";

export type FontWeight = "light" | "normal" | "medium" | "semibold" | "bold";
export type SpacingLevel = "tight" | "normal" | "relaxed" | "loose";

export interface ChunkMetadata {
  listLevel?: number;
  codeLanguage?: string;
  headingLevel?: number;
  isComplete?: boolean;
  hasFollowUp?: boolean;
}

export interface ChunkingOptions {
  minChunkLength?: number;
  maxChunkLength?: number;
  preserveFormatting?: boolean;
  detectLists?: boolean;
  detectCode?: boolean;
  detectHeadings?: boolean;
  fontSizeReduction?: number; // Percentage to reduce font size (0-50)
}

export const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  minChunkLength: 20,
  maxChunkLength: 200,
  preserveFormatting: true,
  detectLists: true,
  detectCode: true,
  detectHeadings: true,
  fontSizeReduction: 20, // 20% smaller font for better readability
};

export class SemanticTextChunker {
  private options: Required<ChunkingOptions>;

  constructor(options: ChunkingOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Main chunking method - analyzes text and returns semantic chunks
   */
  chunkText(text: string): TextChunk[] {
    if (!text.trim()) return [];

    // Step 1: Analyze text structure
    const structure = this.analyzeTextStructure(text);

    // Step 2: Split into logical sections
    const sections = this.splitIntoSections(text, structure);

    // Step 3: Create chunks from sections
    const chunks = this.createChunksFromSections(sections);

    // Step 4: Optimize chunk boundaries
    const optimizedChunks = this.optimizeChunkBoundaries(chunks);

    return optimizedChunks;
  }

  /**
   * Analyze the overall structure of the text
   */
  private analyzeTextStructure(text: string) {
    const lines = text.split("\n");
    const structure = {
      hasHeadings: false,
      hasLists: false,
      hasCodeBlocks: false,
      hasQuotes: false,
      hasTables: false,
      paragraphCount: 0,
      avgLineLength: 0,
      breakPatterns: [] as number[], // Line indices where natural breaks occur
    };

    let totalLength = 0;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.length === 0) {
        structure.breakPatterns.push(i);
        continue;
      }

      totalLength += line.length;

      // Detect patterns
      if (this.isHeading(line)) structure.hasHeadings = true;
      if (this.isListItem(line)) structure.hasLists = true;
      if (this.isCodeBlockMarker(line)) {
        inCodeBlock = !inCodeBlock;
        structure.hasCodeBlocks = true;
      }
      if (this.isQuote(line)) structure.hasQuotes = true;
      if (this.isTableRow(line)) structure.hasTables = true;

      // Detect paragraph breaks
      if (line.length > 20 && !inCodeBlock) {
        structure.paragraphCount++;
      }
    }

    structure.avgLineLength =
      totalLength / lines.filter((l) => l.length > 0).length;

    return structure;
  }

  /**
   * Split text into logical sections based on structure analysis
   */
  private splitIntoSections(text: string, structure: any): string[] {
    const sections: string[] = [];

    // Split by double line breaks first (natural paragraph boundaries)
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();

      // Further split large paragraphs if needed
      if (trimmed.length > this.options.maxChunkLength * 2) {
        sections.push(...this.splitLargeParagraph(trimmed));
      } else {
        sections.push(trimmed);
      }
    }

    return sections;
  }

  /**
   * Split large paragraphs at natural boundaries
   */
  private splitLargeParagraph(text: string): string[] {
    const chunks: string[] = [];
    const sentences = this.splitIntoSentences(text);

    let currentChunk = "";

    for (const sentence of sentences) {
      if (
        currentChunk.length + sentence.length > this.options.maxChunkLength &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? " " : "") + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Split text into sentences while preserving meaning
   */
  private splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting that considers context
    return text
      .split(/([.!?]+\s+)/)
      .reduce((acc: string[], part, index, arr) => {
        if (index % 2 === 0 && part.trim()) {
          const sentence = part + (arr[index + 1] || "");
          acc.push(sentence.trim());
        }
        return acc;
      }, []);
  }

  /**
   * Create chunks from sections with proper typing and metadata
   */
  private createChunksFromSections(sections: string[]): TextChunk[] {
    const chunks: TextChunk[] = [];

    sections.forEach((section, index) => {
      const chunkType = this.detectChunkType(section);
      const metadata = this.extractMetadata(section, chunkType);

      chunks.push({
        id: `chunk_${index}_${Date.now()}`,
        content: section,
        type: chunkType,
        weight: this.getWeightForType(chunkType),
        spacing: this.getSpacingForType(chunkType),
        metadata,
      });
    });

    return chunks;
  }

  /**
   * Optimize chunk boundaries for better readability
   */
  private optimizeChunkBoundaries(chunks: TextChunk[]): TextChunk[] {
    const optimized: TextChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Merge very small chunks with adjacent ones if appropriate
      if (chunk.content.length < this.options.minChunkLength && i > 0) {
        const prevChunk = optimized[optimized.length - 1];
        if (this.canMergeChunks(prevChunk, chunk)) {
          prevChunk.content += " " + chunk.content;
          prevChunk.metadata = { ...prevChunk.metadata, hasFollowUp: true };
          continue;
        }
      }

      // Add transition indicators
      if (i < chunks.length - 1) {
        chunk.metadata = { ...chunk.metadata, hasFollowUp: true };
      }

      optimized.push(chunk);
    }

    return optimized;
  }

  /**
   * Detect the type of content chunk
   */
  private detectChunkType(content: string): ChunkType {
    const trimmed = content.trim();

    if (this.isHeading(trimmed)) return "heading";
    if (this.isCodeBlock(trimmed)) return "code-block";
    if (this.isQuote(trimmed)) return "quote";
    if (this.isListItem(trimmed)) return "list-item";
    if (this.isTableRow(trimmed)) return "table";
    if (this.isEmphasis(trimmed)) return "emphasis";
    if (this.isTransition(trimmed)) return "transition";

    return "paragraph";
  }

  /**
   * Content type detection methods
   */
  private isHeading(text: string): boolean {
    return (
      /^#{1,6}\s+/.test(text) ||
      /^[A-Z][A-Za-z\s]+:?\s*$/.test(text.split("\n")[0])
    );
  }

  private isListItem(text: string): boolean {
    return /^[\s]*[-*+•]\s+/.test(text) || /^[\s]*\d+\.\s+/.test(text);
  }

  private isCodeBlock(text: string): boolean {
    return (
      text.startsWith("```") || text.includes("\n```") || /^[\s]{4,}/.test(text)
    );
  }

  private isCodeBlockMarker(text: string): boolean {
    return text.startsWith("```");
  }

  private isQuote(text: string): boolean {
    return text.startsWith(">") || text.includes("\n>");
  }

  private isTableRow(text: string): boolean {
    return /\|.*\|/.test(text);
  }

  private isEmphasis(text: string): boolean {
    return (
      /\*\*.*\*\*/.test(text) ||
      /_.*_/.test(text) ||
      (text.length < 50 && /^[A-Z\s]+$/.test(text))
    );
  }

  private isTransition(text: string): boolean {
    const transitionWords = [
      "however",
      "furthermore",
      "meanwhile",
      "therefore",
      "consequently",
    ];
    return transitionWords.some((word) => text.toLowerCase().startsWith(word));
  }

  /**
   * Extract metadata for chunks
   */
  private extractMetadata(content: string, type: ChunkType): ChunkMetadata {
    const metadata: ChunkMetadata = {};

    switch (type) {
      case "heading":
        const headingMatch = content.match(/^#{1,6}/);
        metadata.headingLevel = headingMatch ? headingMatch[0].length : 1;
        break;

      case "code-block":
        const langMatch = content.match(/```(\w+)/);
        metadata.codeLanguage = langMatch ? langMatch[1] : "text";
        break;

      case "list-item":
        const indent = content.match(/^[\s]*/);
        metadata.listLevel = indent ? Math.floor(indent[0].length / 2) : 0;
        break;
    }

    return metadata;
  }

  /**
   * Get font weight for chunk type
   */
  private getWeightForType(type: ChunkType): FontWeight {
    const weights: Record<ChunkType, FontWeight> = {
      heading: "bold",
      emphasis: "semibold",
      quote: "medium",
      "code-block": "normal",
      "list-item": "normal",
      table: "normal",
      paragraph: "normal",
      transition: "medium",
    };

    return weights[type];
  }

  /**
   * Get spacing for chunk type
   */
  private getSpacingForType(type: ChunkType): SpacingLevel {
    const spacing: Record<ChunkType, SpacingLevel> = {
      heading: "loose",
      paragraph: "normal",
      "list-item": "tight",
      "code-block": "relaxed",
      quote: "relaxed",
      table: "tight",
      emphasis: "normal",
      transition: "normal",
    };

    return spacing[type];
  }

  /**
   * Check if two chunks can be merged
   */
  private canMergeChunks(chunk1: TextChunk, chunk2: TextChunk): boolean {
    // Don't merge different types
    if (chunk1.type !== chunk2.type) return false;

    // Don't merge if combined length would be too long
    if (
      chunk1.content.length + chunk2.content.length >
      this.options.maxChunkLength
    )
      return false;

    // Don't merge headings or code blocks
    if (chunk1.type === "heading" || chunk1.type === "code-block") return false;

    return true;
  }
}

/**
 * Utility function to create a chunker and process text in one call
 */
export function chunkText(
  text: string,
  options?: ChunkingOptions
): TextChunk[] {
  const chunker = new SemanticTextChunker(options);
  return chunker.chunkText(text);
}

/**
 * Generate CSS classes for chunk styling
 */
export function getChunkStyles(
  chunk: TextChunk,
  baseSize: number = 14
): string {
  const { type, weight, spacing, metadata } = chunk;

  // Calculate font size reduction
  const reducer = DEFAULT_OPTIONS.fontSizeReduction;
  const fontSize = Math.max(10, baseSize * (1 - reducer / 100));

  let classes = `font-${weight} `;

  // Spacing classes
  switch (spacing) {
    case "tight":
      classes += "leading-tight mb-1 ";
      break;
    case "relaxed":
      classes += "leading-relaxed mb-3 ";
      break;
    case "loose":
      classes += "leading-loose mb-4 ";
      break;
    default:
      classes += "leading-normal mb-2 ";
  }

  // Type-specific styles
  switch (type) {
    case "heading":
      const level = metadata?.headingLevel || 1;
      classes += `text-${Math.max(1, 3 - level)}xl `;
      break;
    case "code-block":
      classes += "font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded ";
      break;
    case "quote":
      classes += "border-l-4 border-gray-300 pl-4 italic ";
      break;
    case "emphasis":
      classes += "text-accent ";
      break;
  }

  return classes + `text-[${fontSize}px]`;
}

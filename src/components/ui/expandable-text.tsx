"use client";

import { useState, useRef, useEffect } from "react";

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  mobileMaxLines?: number;
}

export default function ExpandableText({
  text,
  maxLines = 4,
  className = "",
  mobileMaxLines,
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [truncatedText, setTruncatedText] = useState(text);
  const [isMobile, setIsMobile] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const effectiveMaxLines =
    mobileMaxLines && isMobile ? mobileMaxLines : maxLines;

  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;
    const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
    const maxHeight = lineHeight * effectiveMaxLines;

    // Create a temporary element to measure text
    const tempElement = element.cloneNode(true) as HTMLDivElement;
    tempElement.style.position = "absolute";
    tempElement.style.visibility = "hidden";
    tempElement.style.height = "auto";
    tempElement.style.maxHeight = "none";
    tempElement.textContent = text;

    document.body.appendChild(tempElement);

    if (tempElement.scrollHeight > maxHeight) {
      setIsTruncated(true);

      // Binary search to find the optimal truncation point
      let low = 0;
      let high = text.length;
      let bestFit = "";

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const testText = text.substring(0, mid);
        tempElement.textContent = testText + "...";

        if (tempElement.scrollHeight <= maxHeight) {
          bestFit = testText;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      // Find the last complete word
      const lastSpaceIndex = bestFit.lastIndexOf(" ");
      if (lastSpaceIndex > 0) {
        bestFit = bestFit.substring(0, lastSpaceIndex);
      }

      setTruncatedText(bestFit);
    } else {
      setIsTruncated(false);
    }

    document.body.removeChild(tempElement);
  }, [text, effectiveMaxLines, isMobile]);

  const displayText = isExpanded ? text : truncatedText;

  return (
    <div className={className}>
      <div
        ref={textRef}
        className="leading-relaxed"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: isExpanded ? "unset" : effectiveMaxLines,
          WebkitBoxOrient: "vertical",
          overflow: isExpanded ? "visible" : "hidden",
        }}
      >
        {isExpanded ? (
          <>
            {text}
            {isTruncated && (
              <button
                onClick={() => setIsExpanded(false)}
                className="ml-1 text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              >
                Show Less
              </button>
            )}
          </>
        ) : (
          <>
            {displayText}
            {isTruncated && (
              <>
                <span>...</span>
                <button
                  onClick={() => setIsExpanded(true)}
                  className="ml-1 text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                >
                  View More
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

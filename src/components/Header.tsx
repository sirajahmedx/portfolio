"use client";

import { useEffect, useState } from "react";
import { Github, Star, MessageCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Header() {
  const [stars, setStars] = useState<number | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch("/api/github-stars");
        if (response.ok) {
          const data = await response.json();
          setStars(data.stars);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };
    fetchStars();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/30 shadow-sm h-16">
      <div className="flex h-full items-center justify-between px-4 max-w-5xl mx-auto">
        <Link
          href="/"
          className="font-bold text-lg tracking-tight text-foreground hover:text-primary transition-colors"
        >
          Siraj Ahmed
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/projects"
            className="text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/chat"
            className="text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
          >
            Chat
          </Link>
          <a
            href="https://github.com/sirajahmedx"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View GitHub profile"
            title={`Total stars earned on my repos: ${stars !== null ? stars.toLocaleString() : "..."}`}
          >
            <Github className="h-5 w-5" />
            <span className="font-mono text-sm min-w-[32px] text-center">
              {error ? (
                <span className="text-destructive">--</span>
              ) : stars !== null ? (
                stars.toLocaleString()
              ) : (
                <span className="animate-pulse">...</span>
              )}
            </span>
            <Star className="h-4 w-4 text-yellow-500" />
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

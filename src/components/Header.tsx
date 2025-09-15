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
      } catch (error) {
        console.error("Failed to fetch stars:", error);
        setError(true);
      }
    };
    fetchStars();
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/30 shadow-sm"
      style={{ height: "64px" }}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Link
            href={"/"}
            className="group flex items-center gap-2 transition-all duration-300 hover:scale-105"
          >
            <span className="text-foreground text-xl sm:text-2xl font-black tracking-tight font-sans bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text transition-all duration-300 group-hover:from-primary group-hover:to-primary/80">
              <span className="sm:hidden">Siraj</span>
              <span className="hidden sm:inline">Siraj Ahmed</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/chat"
            className="group text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm font-medium transition-all duration-300 hover:bg-accent/50 hover:scale-105 active:scale-95"
            aria-label="Start a chat"
          >
            <MessageCircle className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            <span className="hidden sm:inline">Chat</span>
          </Link>

          <a
            href="https://github.com/sirajahmedx"
            target="_blank"
            rel="noopener noreferrer"
            className="group text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm font-medium transition-all duration-300 hover:bg-accent/50 hover:scale-105 active:scale-95"
            aria-label="View Siraj Ahmed's GitHub profile"
          >
            <Github className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-xs sm:text-sm font-mono">
              {error ? (
                <span className="text-destructive">Error</span>
              ) : stars !== null ? (
                <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent font-semibold">
                  {stars.toLocaleString()}
                </span>
              ) : (
                <span className="animate-pulse">...</span>
              )}
            </span>
            <Star className="h-3.5 w-3.5 text-yellow-500 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
          </a>

          <div className="ml-1 sm:ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Github, Star } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
      className="fixed top-0 left-0 right-0 z-60 bg-background/80 backdrop-blur-md border-b border-border/20"
      style={{ height: "56px" }}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/fastfolio-logo.png"
            alt="Logo"
            width={24}
            height={24}
            className="rounded"
          />
          <Link href={"/"} className="flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">
              Siraj Ahmed
            </span>
          </Link>
        </div>

        {/* Right side - GitHub and Theme */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/sirajahmedx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all duration-200"
            aria-label="View Siraj Ahmed's GitHub profile"
          >
            <Github className="h-3.5 w-3.5" />
            {error ? (
              <span>Unavailable</span>
            ) : stars !== null ? (
              <span>{stars}</span>
            ) : (
              <span>Loading...</span>
            )}
            <Star className="h-3 w-3" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

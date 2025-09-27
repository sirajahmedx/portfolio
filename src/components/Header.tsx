"use client";

import { useEffect, useState } from "react";
import { Github, Star, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const [stars, setStars] = useState<number | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isChatPage = pathname === "/chat";

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (isChatPage) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-primary/5 via-background/95 to-accent/5 backdrop-blur-xl border-b border-border/30 shadow-sm h-16">
        <div className="grid grid-cols-3 h-full items-center px-4 max-w-5xl mx-auto">
          <Link
            href="/"
            className="font-bold text-lg tracking-tight text-foreground hover:text-primary transition-colors"
          >
            Siraj Ahmed
          </Link>

          <nav className="hidden md:flex items-center justify-center gap-6 col-start-2">
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
            >
              Work
            </Link>
            <Link
              href="/chat"
              className="text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
            >
              Chat
            </Link>
          </nav>

          <div className="flex items-center gap-2 justify-end col-start-3">
            {/* mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded p-2 text-foreground hover:bg-muted transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-sidebar"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            <div className="hidden md:flex items-center gap-3">
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
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
          id="mobile-sidebar"
        >
          {/* overlay */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* sidebar panel */}
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-background border-r border-border shadow-lg">
            <button
              type="button"
              className="absolute top-4 right-4 inline-flex items-center justify-center rounded p-2 text-foreground hover:bg-muted transition-colors"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>

            {/* centered nav inside sidebar */}
            <div className="h-full flex items-center justify-center px-6">
              <nav className="flex flex-col items-center gap-6">
                <Link
                  href="/projects"
                  className="text-foreground hover:text-primary text-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Work
                </Link>
                <Link
                  href="/chat"
                  className="text-foreground hover:text-primary text-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Chat
                </Link>
              </nav>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

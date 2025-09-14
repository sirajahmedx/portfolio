"use client";

import FluidCursor from "@/components/FluidCursor";
import { Button } from "@/components/ui/button";
import WelcomeModal from "@/components/welcome-modal";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  Code,
  Coffee,
  Laugh,
  Layers,
  Sparkles,
  UserRoundSearch,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* ---------- quick-question data ---------- */
const questions = {
  Me: "Who are you? I want to know more about you.",
  Projects: "What are your projects? What are you working on right now?",
  Skills: "What are your skills? Give me a list of your soft and hard skills.",
  Contact: "How can I contact you?",
} as const;

const questionConfig = [
  { key: "Me", color: "#329696", icon: Laugh },
  { key: "Projects", color: "#3E9858", icon: BriefcaseBusiness },
  { key: "Skills", color: "#856ED9", icon: Layers },
  { key: "Contact", color: "#C19433", icon: UserRoundSearch },
] as const;

/* ---------- component ---------- */
export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const goToChat = (query: string) =>
    router.push(`/chat?query=${encodeURIComponent(query)}`);

  /* hero animations */
  const heroVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  useEffect(() => {
    // Preload assets
    const img = new window.Image();
    img.src = "/landing-memojis.png";

    const linkWebm = document.createElement("link");
    linkWebm.rel = "preload";
    linkWebm.as = "video";
    linkWebm.href = "/final_memojis.webm";
    document.head.appendChild(linkWebm);

    const linkMp4 = document.createElement("link");
    linkMp4.rel = "prefetch";
    linkMp4.as = "video";
    linkMp4.href = "/final_memojis_ios.mp4";
    document.head.appendChild(linkMp4);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="from-primary/5 via-background to-accent/5 absolute inset-0 bg-gradient-to-br" />

      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-20">
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="bg-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl" />
          <div className="bg-accent/10 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl" />
        </div>

        <motion.div
          className="z-10 flex max-w-6xl flex-col items-center text-center lg:flex-row lg:items-center lg:justify-between lg:text-left"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8 }}
        >
          {/* Left side - Text content */}
          <div className="flex-1 space-y-6 lg:pr-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              Available for new opportunities
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
            >
              Hi, I'm{" "}
              <span className="from-primary to-accent bg-gradient-to-r bg-clip-text text-transparent">
                Siraj
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-xl sm:text-2xl"
            >
              Full-Stack Developer building modern, dynamic web applications.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <div className="bg-card flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                <Code className="text-primary h-4 w-4" />
                React & Next.js
              </div>
              <div className="bg-card flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                <Coffee className="text-primary h-4 w-4" />
                Node.js & GraphQL
              </div>
            </motion.div>
          </div>

          {/* Right side - Memoji */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="relative mt-12 lg:mt-0"
          >
            <div className="from-primary/20 to-accent/20 relative h-64 w-64 overflow-hidden rounded-full bg-gradient-to-br p-1 sm:h-80 sm:w-80">
              <Image
                src="/avatar-landing.png"
                alt="Siraj Ahmed - Full Stack Developer"
                width={400}
                height={400}
                priority
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="z-10 mt-16 w-full max-w-2xl"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) goToChat(input.trim());
            }}
            className="relative"
          >
            <div className="bg-card/50 hover:bg-card/70 border-border/50 hover:border-border/80 flex items-center rounded-2xl border-2 p-2 shadow-lg backdrop-blur-xl transition-all duration-300">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about my work, skills, or projects..."
                className="text-foreground placeholder:text-muted-foreground flex-1 border-none bg-transparent px-4 py-3 text-base focus:outline-none"
              />
              <Button
                type="submit"
                disabled={!input.trim()}
                size="lg"
                className="rounded-xl px-6 py-3 shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </form>

          {/* Quick questions */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {questionConfig.map(({ key, color, icon: Icon }) => (
              <Button
                key={key}
                onClick={() => goToChat(questions[key])}
                variant="outline"
                className="bg-card/50 hover:bg-card/70 border-border/50 hover:border-border/80 h-auto cursor-pointer rounded-xl px-4 py-3 shadow-sm backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              >
                <div className="text-foreground flex items-center gap-2">
                  <Icon size={16} strokeWidth={2} style={{ color }} />
                  <span className="text-sm font-medium">{key}</span>
                </div>
              </Button>
            ))}
          </div>
        </motion.div>
      </section>

      <FluidCursor />
    </div>
  );
}

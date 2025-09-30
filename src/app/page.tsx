"use client";

import FluidCursor from "@/components/FluidCursor";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
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
  ArrowUp,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import StyleSelector from "@/components/chat/style-selector";

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

export default function Home() {
  const [input, setInput] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<
    "polite" | "concise" | "versatile" | "creative"
  >("polite");
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState("auto");

  const goToChat = (query: string) =>
    router.push(
      `/chat?query=${encodeURIComponent(query)}&style=${selectedStyle}`
    );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      goToChat(input.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleStyleChange = (
    style: "polite" | "concise" | "versatile" | "creative"
  ) => {
    setSelectedStyle(style);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 80)}px`;
    }
  }, [input]);

  const heroVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 140)}px`;
      setTextareaHeight(`${Math.min(inputRef.current.scrollHeight, 140)}px`);
    }
  }, [input]);

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />

      {/* <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-20 left-4 z-20 sm:hidden inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
      >
        <Sparkles className="h-2.5 w-2.5" />
        Available for new opportunities
      </motion.div> */}

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      <div className="flex-1 flex flex-col">
        {/* Hero Section - Upper portion */}
        <section className="relative flex-1 flex flex-col justify-center px-4 pt-2 sm:pt-4 md:pt-6 lg:pt-8">
          {/* Floating elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Removed floating blur elements for uniform background */}
          </div>

          <motion.div
            className="z-10 flex w-full max-w-7xl mx-auto flex-col items-center text-center gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between lg:text-left lg:gap-12 xl:gap-16"
            variants={heroVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.8 }}
          >
            {/* Left side - Text content */}
            <div className="flex-1 space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 lg:pr-6 xl:pr-8">
              {/* <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="hidden sm:inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm font-medium text-primary-foreground"
              >
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                Available for new opportunities
              </motion.div> */}

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl sm:text-6xl md:text-6xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold tracking-tight text-balance leading-tight sm:leading-tight md:leading-tight"
              >
                Hi, I&apos;m{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Siraj
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl max-w-xl sm:max-w-2xl mx-auto lg:mx-0 text-pretty leading-relaxed"
              >
                Full-Stack Developer building modern, dynamic web applications.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 md:gap-5"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-card px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-border/50">
                  <Code className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                  React & Next.js
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-card px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-border/50">
                  <Coffee className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                  Node.js & GraphQL
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="relative mt-4 sm:mt-6 lg:mt-0 flex-shrink-0 hidden lg:block xl:block"
            >
              <div className="relative h-48 w-48 xl:h-56 xl:w-56 2xl:h-60 2xl:w-60 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-1 shadow-xl">
                <Image
                  src="/avatar-landing.png"
                  alt="Siraj Ahmed - Full Stack Developer"
                  width={256}
                  height={256}
                  priority
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section
          className="relative px-4 pb-6 sm:pb-8 md:pb-12 lg:pb-16 xl:pb-20 
                           flex flex-col justify-end
                           h-auto sm:h-auto md:min-h-[25vh] lg:min-h-[30vh] xl:min-h-[25vh]
                           sm:mt-8 md:mt-12 lg:mt-0"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="z-10 w-full max-w-2xl mx-auto space-y-4 sm:space-y-5 md:space-y-6"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 md:gap-3">
              {questionConfig.map(({ key, color, icon: Icon }) => (
                <Button
                  key={key}
                  onClick={() => goToChat(questions[key])}
                  variant="outline"
                  className="h-auto cursor-pointer rounded-lg sm:rounded-xl bg-card/50 border-border/50 px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:border-border/80 hover:bg-card/70 active:scale-95"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 text-foreground">
                    <Icon
                      size={12}
                      strokeWidth={2}
                      style={{ color }}
                      className="sm:h-3.5 sm:w-3.5 md:h-4 md:w-4"
                    />
                    <span className="text-xs sm:text-xs md:text-sm font-medium">
                      {key}
                    </span>
                  </div>
                </Button>
              ))}
            </div>

            {/* Page.tsx */}
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-end rounded-2xl sm:rounded-3xl border-2 border-border/50 p-2 sm:p-2.5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-border/80">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim()) {
                        handleSubmit(e as any);
                      }
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="flex-1 border-none bg-transparent px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none resize-none overflow-hidden"
                  style={{
                    height: "auto",
                    minHeight: "48px",
                    maxHeight: "140px",
                  }}
                  rows={1}
                />
                <div className="flex items-center mr-2">
                  <StyleSelector
                    selectedStyle={selectedStyle}
                    onStyleChange={handleStyleChange}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center px-3 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                >
                  <ArrowUp className="h-4 w-4 md:h-4 md:w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </section>
      </div>

      <FluidCursor />
    </div>
  );
}

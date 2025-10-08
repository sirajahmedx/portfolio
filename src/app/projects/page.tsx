"use client";
import AllProjects from "@/components/projects/AllProjects";
import { motion } from "framer-motion";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 md:pb-8 lg:pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden safe-area-inset-top">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-3 sm:space-y-4 md:space-y-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent leading-tight px-2"
            >
              What I have built
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4 sm:px-6"
            >
              A curated collection of my best work, showcasing expertise in
              <span className="text-primary font-semibold dark:text-primary/90">
                {" "}
                full-stack development
              </span>
              ,
              <span className="text-primary font-semibold dark:text-primary/80">
                {" "}
                modern web technologies
              </span>
              , and
              <span className="text-primary font-semibold dark:text-primary/90">
                {" "}
                innovative solutions
              </span>
              .
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6 md:mt-8 px-4 sm:px-6"
            >
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-card/80 dark:bg-card/60 rounded-full border border-border/50 text-foreground text-xs sm:text-sm md:text-base backdrop-blur-sm">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="whitespace-nowrap">
                  Full-Stack Applications
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-card/80 dark:bg-card/60 rounded-full border border-border/50 text-foreground text-xs sm:text-sm md:text-base backdrop-blur-sm">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                <span className="whitespace-nowrap">Mobile Development</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-card/80 dark:bg-card/60 rounded-full border border-border/50 text-foreground text-xs sm:text-sm md:text-base backdrop-blur-sm">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-purple-500 rounded-full animate-pulse"></span>
                <span className="whitespace-nowrap">Automation Tools</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Enhanced Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="absolute -top-20 sm:-top-32 md:-top-40 -right-20 sm:-right-32 md:-right-40 h-40 w-40 sm:h-60 sm:w-60 md:h-80 md:w-80 rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.7 }}
            className="absolute -bottom-20 sm:-bottom-32 md:-bottom-40 -left-20 sm:-left-32 md:-left-40 h-40 w-40 sm:h-60 sm:w-60 md:h-80 md:w-80 rounded-full bg-accent/10 dark:bg-accent/20 blur-3xl"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.9 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-48 w-48 sm:h-72 sm:w-72 md:h-96 md:w-96 rounded-full bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/15 dark:to-accent/15 blur-3xl"
          />
        </div>
      </section>

      {/* Simple Separator */}
      <div className="py-3 sm:py-4 md:py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="h-px bg-gradient-to-r from-transparent via-border to-transparent"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center text-sm sm:text-base md:text-lg text-muted-foreground mt-4 sm:mt-5 md:mt-6 px-4 sm:px-6"
          >
            Discover my work below
          </motion.p>
        </div>
      </div>

      <section className="pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
        <AllProjects />
      </section>
    </div>
  );
}

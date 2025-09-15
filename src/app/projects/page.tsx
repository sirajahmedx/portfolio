"use client";
import AllProjects from "@/components/projects/AllProjects";
import { motion } from "framer-motion";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 pb-8 md:pt-24 md:pb-12 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4 md:space-y-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight"
            >
              What I have built
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4"
            >
              A curated collection of my best work, showcasing expertise in
              <span className="text-primary font-semibold">
                {" "}
                full-stack development
              </span>
              ,
              <span className="text-accent font-semibold">
                {" "}
                modern web technologies
              </span>
              , and
              <span className="text-primary font-semibold">
                {" "}
                innovative solutions
              </span>
              .
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap justify-center gap-2 md:gap-4 mt-6 md:mt-8 px-4"
            >
              <div className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1 md:py-2 bg-card rounded-full border text-xs md:text-sm">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full"></span>
                Full-Stack Applications
              </div>
              <div className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1 md:py-2 bg-card rounded-full border text-xs md:text-sm">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full"></span>
                Mobile Development
              </div>
              <div className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1 md:py-2 bg-card rounded-full border text-xs md:text-sm">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full"></span>
                Automation Tools
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
            className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.7 }}
            className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.9 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 blur-3xl"
          />
        </div>
      </section>

      {/* Simple Separator */}
      <div className="py-4 md:py-6 px-4">
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
            className="text-center text-lg md:text-base text-muted-foreground mt-6"
          >
            Discover my work below
          </motion.p>
        </div>
      </div>

      {/* Projects Section */}
      <section className="pb-16 md:pb-20 px-4">
        <AllProjects />
      </section>
    </div>
  );
}

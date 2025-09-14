"use client";
import { Card, Carousel } from "@/components/projects/apple-cards-carousel";
import { data } from "@/components/projects/Data";
import { motion } from "framer-motion";
import { Code, ExternalLink, Github, Filter } from "lucide-react";
import { useState } from "react";

export default function AllProjects() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    ...Array.from(new Set(data.map((item) => item.category))),
  ];

  const filteredData =
    selectedCategory === "All"
      ? data
      : data.filter((item) => item.category === selectedCategory);

  const cards = filteredData.map((card, index) => (
    <Card key={card.src} card={card} index={index} layout={true} />
  ));

  return (
    <div className="w-full">
      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-7xl mx-auto mb-8 px-4"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Projects Grid/Carousel */}
      <div className="max-w-7xl mx-auto">
        <Carousel items={cards} />
      </div>

      {/* Additional Projects Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-7xl mx-auto mt-20 px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
            🎯 Project Highlights
          </div>
          <h3 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            What I Build
          </h3>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            These projects demonstrate my expertise in modern web technologies,
            from full-stack applications to mobile development and automation
            tools. Each represents a unique challenge and learning experience.
          </p>
        </motion.div>

        {/* Tech Stack Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-card to-card/50 rounded-xl p-6 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-lg">Frontend</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              React, Next.js, Tailwind CSS, TypeScript, Framer Motion
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-card to-card/50 rounded-xl p-6 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Code className="h-6 w-6 text-accent" />
              </div>
              <h4 className="font-semibold text-lg">Backend</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Node.js, GraphQL, Socket.io, MongoDB, JWT Authentication
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-card to-card/50 rounded-xl p-6 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Code className="h-6 w-6 text-purple-500" />
              </div>
              <h4 className="font-semibold text-lg">Mobile & Tools</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              React Native, GitHub API, Automation, Android Development
            </p>
          </motion.div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-8 text-lg">
            Interested in collaborating or have questions about my work?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="https://github.com/sirajahmedx"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
              <Github className="h-5 w-5" />
              View on GitHub
            </motion.a>
            <motion.a
              href="/chat?query=I'd like to discuss your projects"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-300 font-medium"
            >
              <ExternalLink className="h-5 w-5" />
              Let's Chat
            </motion.a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

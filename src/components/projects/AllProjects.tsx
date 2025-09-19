"use client";
import { Card, Carousel } from "@/components/projects/apple-cards-carousel";
import { mainProjects } from "@/components/projects/Data";
import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";

export default function AllProjects() {
  const cards = mainProjects.map((card, index) => (
    <Card key={card.title} card={card} index={index} layout={true} />
  ));

  return (
    <div className="w-full">
      {/* Projects Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-16"
      >
        <div className="max-w-7xl mx-auto mb-8 px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-3xl font-bold text-foreground mb-4"
          >
            Featured Projects
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            A showcase of my full-stack applications and platforms
          </motion.p>
        </div>

        {/* Projects Carousel */}
        <div className="max-w-7xl mx-auto">
          <Carousel items={cards} />
        </div>
      </motion.div>

      {/* Additional Projects Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-7xl mx-auto mt-20 px-4"
      >
        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-8 text-base md:text-lg px-4">
            Interested in collaborating or have questions about my work?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="https://github.com/sirajahmedx"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:shadow-lg transition-all duration-300 font-medium backdrop-blur-sm"
            >
              <Github className="h-4 w-4 md:h-5 md:w-5" />
              View on GitHub
            </motion.a>
            <motion.a
              href="/chat?query=How Can I Contact You."
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300 font-medium backdrop-blur-sm"
            >
              <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
              Let's Chat
            </motion.a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Award, Code, GraduationCap, Mail, MessageSquare } from "lucide-react";
import React from "react";

interface ChatLandingProps {
  submitQuery: (query: string) => void;
  hasReachedLimit?: boolean;
}

const ChatLanding: React.FC<ChatLandingProps> = ({
  submitQuery,
  hasReachedLimit = false,
}) => {
  // Suggested questions that the user can click on
  const suggestedQuestions = [
    {
      icon: <MessageSquare className="h-4 w-4" />,
      text: "Who are you?",
    },
    {
      icon: <Code className="h-4 w-4" />,
      text: "What projects have you worked on?",
    },
    {
      icon: <Award className="h-4 w-4" />,
      text: "What are your skills?",
    },
    {
      icon: <Mail className="h-4 w-4" />,
      text: "How can I contact you?",
    },
  ];

  // Animation variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <motion.div
      className="flex w-full flex-col items-center px-4 py-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Welcome message */}
      <motion.div className="mb-4 md:mb-8 text-center" variants={itemVariants}>
        <h2 className="mb-2 md:mb-3 text-lg md:text-2xl font-semibold leading-relaxed">
          I'm Siraj's digital twin
        </h2>
        <p className="text-muted-foreground mx-auto max-w-md text-xs md:text-base leading-relaxed">
          A passionate 16-year-old developer from Pakistan.
        </p>
      </motion.div>

      {/* Suggested questions */}
      <motion.div
        className="w-full max-w-md space-y-2 md:space-y-3"
        variants={containerVariants}
      >
        {suggestedQuestions.map((question, index) => (
          <motion.button
            key={index}
            className={`flex w-full items-center rounded-lg px-2 md:px-4 py-2 md:py-3 transition-colors ${
              hasReachedLimit
                ? "bg-gray-100 cursor-not-allowed opacity-50"
                : "bg-accent hover:bg-accent/80"
            }`}
            onClick={() => !hasReachedLimit && submitQuery(question.text)}
            variants={itemVariants}
            whileHover={!hasReachedLimit ? { scale: 1.02 } : {}}
            whileTap={!hasReachedLimit ? { scale: 0.98 } : {}}
            disabled={hasReachedLimit}
          >
            <span className="bg-background mr-2 md:mr-3 rounded-full p-1 md:p-2">
              {question.icon}
            </span>
            <span className="text-left text-xs md:text-base leading-relaxed">
              {question.text}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ChatLanding;

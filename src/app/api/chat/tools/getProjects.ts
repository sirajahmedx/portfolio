import { tool } from "ai";
import { z } from "zod";


export const getProjects = tool({
  description:
    "This tool will show a list of all projects made by Raphael",
  parameters: z.object({}),
  execute: async () => {
    try {
      // Simulate fetching project data from an API or database
      const projects = [
        { name: "Portfolio Website", description: "A personal portfolio built with Next.js and Tailwind CSS." },
        { name: "Chat Application", description: "A real-time chat app using Socket.io and Node.js." },
        { name: "E-commerce Platform", description: "A full-stack e-commerce platform with React and MongoDB." },
      ];

      // Format the project data into a readable string
      const projectList = projects
        .map((project, index) => `${index + 1}. ${project.name} - ${project.description}`)
        .join("\n");

      return `Here are some of the projects made by Raphael:\n\n${projectList}`;
    } catch (error) {
      console.error("Error fetching projects:", error);
      return "Sorry, I couldn't fetch the project list at the moment. Please try again later.";
    }
  },
});
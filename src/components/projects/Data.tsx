"use client";
import Image from "next/image";
import { Image as Img } from "lucide-react";
import { ChevronRight, Link } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

// Enhanced project content array with all projects
const PROJECT_CONTENT = [
  {
    title: "Jobify",
    description:
      "Full-stack platform for service providers and clients, featuring booking management, notifications, payments, and real-time chat. Web frontend, GraphQL API backend, socket server for real-time messaging, supports roles, categories, services, dashboards.",
    techStack: [
      "React",
      "Next.js",
      "Tailwind CSS",
      "Apollo Client",
      "Node.js",
      "Express.js",
      "GraphQL",
      "Socket.io",
      "MongoDB",
      "JWT (auth.js)",
    ],
    date: "2024",
    links: [
      {
        name: "GitHub",
        url: "https://github.com/sirajahmedx",
      },
    ],
    images: [
      {
        src: "/avatar-landing.png",
        alt: "Jobify dashboard interface",
      },
      {
        src: "/dark-home.png",
        alt: "Jobify platform overview",
      },
    ],
  },
  {
    title: "Servifi",
    description:
      "Service platform connecting tradesmen with customers. Includes backend APIs for bookings, categories, payments, web dashboards, real-time chat, notifications, supplier management.",
    techStack: [
      "React",
      "Next.js",
      "Tailwind CSS",
      "Apollo Client",
      "Node.js",
      "Express.js",
      "GraphQL",
      "Socket.io",
      "MongoDB",
      "JWT (auth.js)",
    ],
    date: "2024",
    links: [
      {
        name: "GitHub",
        url: "https://github.com/sirajahmedx",
      },
    ],
    images: [
      {
        src: "/dark-home.png",
        alt: "Tradesman dashboard",
      },
      {
        src: "/light-home.png",
        alt: "Tradesman booking system",
      },
    ],
  },
  {
    title: "Talent-Tube",
    description:
      "Multi-platform talent discovery and hiring app, including video content (shorts), bookings, follow systems, notifications, and content management. Web frontend, Android mobile app, GraphQL backend, socket support for real-time features.",
    techStack: [
      "React",
      "Next.js",
      "Tailwind CSS",
      "Apollo Client",
      "Android (Kotlin/Java)",
      "Node.js",
      "Express.js",
      "GraphQL",
      "Socket.io",
      "MongoDB",
      "JWT (auth.js)",
    ],
    date: "2024",
    links: [
      {
        name: "GitHub",
        url: "https://github.com/sirajahmedx",
      },
    ],
    images: [
      {
        src: "/light-chat.png",
        alt: "Talent-Tube main interface",
      },
      {
        src: "/dark-chat.png",
        alt: "Talent-Tube mobile app",
      },
    ],
  },
  {
    title: "Tuneit",
    description:
      "Mobile app connecting users with services, fully created by me. Handles all features and flows, including real-time updates for service notifications.",
    techStack: [
      "React Native",
      "Node.js",
      "Express.js",
      "GraphQL",
      "Socket.io",
      "MongoDB",
      "JWT (auth.js)",
    ],
    date: "2024",
    links: [
      {
        name: "GitHub",
        url: "https://github.com/sirajahmedx",
      },
    ],
    images: [
      {
        src: "/avatar-landing.png",
        alt: "Tuneit mobile app",
      },
      {
        src: "/dark-home.png",
        alt: "Tuneit service interface",
      },
    ],
  },
  {
    title: "GitHub Bot",
    description:
      "GitHub automation toolkit with three standalone bots for following users, unfollowing users, and generating fake commits. Features rate limiting, progress persistence, and human-like behavior for safe automation.",
    techStack: ["Node.js", "GitHub API"],
    date: "2024",
    links: [
      {
        name: "GitHub",
        url: "https://github.com/sirajahmedx",
      },
    ],
    images: [
      {
        src: "/light-home.png",
        alt: "GitHub Bot interface",
      },
    ],
  },
  {
    title: "Sensify (School Project)",
    description:
      "React Native mobile app suite with sensor-based tools for measuring light, detecting magnets, leveling surfaces, and more.",
    techStack: ["React Native", "Node.js", "Express.js", "MongoDB"],
    date: "2024",
    links: [
      {
        name: "GitHub",
        url: "https://github.com/sirajahmedx",
      },
    ],
    images: [
      {
        src: "/dark-chat.png",
        alt: "Sensify sensor tools",
      },
    ],
  },
];

// Define interface for project prop
interface ProjectProps {
  title: string;
  description?: string;
  techStack?: string[];
  date?: string;
  links?: { name: string; url: string }[];
  images?: { src: string; alt: string }[];
}

const ProjectContent = ({ project }: { project: ProjectProps }) => {
  // Find the matching project data
  const projectData = PROJECT_CONTENT.find((p) => p.title === project.title);

  if (!projectData) {
    return <div>Project details not available</div>;
  }

  return (
    <div className="space-y-10">
      {/* Header section with description */}
      <div className="rounded-3xl bg-[#F5F5F7] p-8 dark:bg-[#1D1D1F]">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span>{projectData.date}</span>
          </div>

          <p className="text-secondary-foreground font-sans text-base leading-relaxed md:text-lg">
            {projectData.description}
          </p>

          {/* Tech stack */}
          <div className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm tracking-wide text-neutral-500 dark:text-neutral-400">
                Technologies Used
              </h3>
              <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
            </div>
            <div className="flex flex-wrap gap-3">
              {projectData.techStack.map((tech, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 px-4 py-2 text-sm font-medium text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 hover:shadow-md transition-shadow"
                >
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  {tech}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Links section */}
      {projectData.links && projectData.links.length > 0 && (
        <div className="mb-24">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-sm tracking-wide text-neutral-500 dark:text-neutral-400">
              Project Links
            </h3>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-4">
            {projectData.links.map((link, index) => (
              <motion.a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-between rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-neutral-200 dark:border-neutral-600"
              >
                <span className="font-medium capitalize text-neutral-800 dark:text-neutral-200">
                  {link.name}
                </span>
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1 text-neutral-600 dark:text-neutral-400" />
              </motion.a>
            ))}
          </div>
        </div>
      )}

      {/* Images gallery */}
      {projectData.images && projectData.images.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm tracking-wide text-neutral-500 dark:text-neutral-400">
              Project Gallery
            </h3>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
          </div>

          {projectData.images.length === 1 ? (
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
              <Image
                src={projectData.images[0].src}
                alt={projectData.images[0].alt}
                fill
                className="object-cover transition-transform hover:scale-105"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectData.images.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-video overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 group cursor-pointer"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover transition-all duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main data export with updated content and gradients
export const mainProjects = [
  {
    category: "Full-Stack Platform",
    title: "Jobify",
    description:
      "Jobify is a comprehensive service marketplace platform that connects service providers with clients. Features booking management, secure payments, and real-time chat functionality. Built with React, Next.js, GraphQL, and MongoDB for scalable performance.",
    gradient: "from-emerald-600/60 to-teal-700/60",
    content: <ProjectContent project={{ title: "Jobify" }} />,
  },
  {
    category: "Service Platform",
    title: "Servifi",
    description:
      "Servifi is a comprehensive service platform connecting tradesmen with customers through advanced backend APIs. Features provider profiles, service listings, booking systems, and payment processing. Includes admin dashboards and real-time communication systems.",
    gradient: "from-yellow-500/60 to-amber-600/60",
    content: <ProjectContent project={{ title: "Servifi" }} />,
  },
  {
    category: "Talent Discovery App",
    title: "Talent-Tube",
    description:
      "Talent-Tube is a multi-platform talent discovery app combining video content and hiring capabilities. Features real-time chat system, user profiles, skill tagging, and content management. Built with React, Next.js, GraphQL, and Android native development.",
    gradient: "from-purple-600/60 to-pink-600/60",
    content: <ProjectContent project={{ title: "Talent-Tube" }} />,
  },
  {
    category: "Mobile App",
    title: "Tuneit",
    description:
      "Tuneit is a mobile app connecting users with services, developed entirely by me from concept to implementation. Features service browsing, provider profiles, booking systems, and real-time notifications. Built with React Native, Node.js, GraphQL, and MongoDB.",
    gradient: "from-slate-500/60 to-slate-700/60",
    content: <ProjectContent project={{ title: "Tuneit" }} />,
  },
  {
    category: "Automation Tool",
    title: "GitHub Bot",
    description:
      "GitHub automation toolkit with three standalone bots for following users, unfollowing users, and generating fake commits. Features rate limiting, progress persistence, and human-like behavior for safe automation. Built with Node.js and GitHub API.",
    gradient: "from-[#6E7681]/60 to-[#484F58]/60",
    content: <ProjectContent project={{ title: "GitHub Bot" }} />,
  },
  {
    category: "School Project",
    title: "Sensify",
    description:
      "React Native mobile app suite with sensor-based tools for measuring light, detecting magnets, leveling surfaces, and more. Features real-time sensor data processing and cross-platform compatibility. Built with React Native, Node.js, and MongoDB.",
    gradient: "from-cyan-500/60 to-blue-500/60",
    content: <ProjectContent project={{ title: "Sensify (School Project)" }} />,
  },
];
export const sideProjects = [
  {
    category: "Automation Tool",
    title: "GitHub Bot",
    gradient: "from-gray-800 to-gray-600",
    content: <ProjectContent project={{ title: "GitHub Bot" }} />,
  },
  {
    category: "School Project",
    title: "Sensify",
    gradient: "from-white to-gray-200",
    content: <ProjectContent project={{ title: "Sensify (School Project)" }} />,
  },
];

// Legacy export for backward compatibility
export const data = mainProjects.map((project) => ({
  ...project,
  src: undefined, // Remove src for legacy compatibility
}));

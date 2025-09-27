"use client";
import Image from "next/image";
import { Image as Img } from "lucide-react";
import { ChevronRight, Link } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

// Enhanced project content array with all projects
const PROJECT_CONTENT = [
  {
    title: "Portfolio Website",
    description:
      "Personal portfolio website showcasing my projects, skills, and experience as a full-stack developer. Features responsive design, dark/light theme toggle, interactive project cards, contact forms, and smooth animations. Built with modern web technologies for optimal performance and user experience.",
    techStack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Framer Motion",
      "Lucide Icons",
      "React Hook Form",
      "Email.js",
    ],
    date: "2025",
    links: [
      {
        name: "Live Demo",
        url: "https://sirajahmedx.vercel.app",
      },
      {
        name: "GitHub",
        url: "https://github.com/sirajahmedx/portfolio",
      },
    ],
    images: [
      {
        src: "/portfolio/home.png",
        alt: "Portfolio homepage",
      },
      {
        src: "/portfolio/chat.png",
        alt: "Portfolio contact/chat section",
      },
    ],
  },
  {
    title: "Jobifyy",
    description:
      "Full-stack platform for service providers and clients, featuring booking management, notifications, payments, and real-time chat. Web frontend, GraphQL API backend, socket server for real-time messaging, supports roles, categories, services, dashboards.",
    techStack: [
      "React",
      "Next.js",
      "Tailwind CSS",
      "Apollo Client",
      "Stripe API",
      "Node.js",
      "Express.js",
      "GraphQL",
      "Socket.io",
      "MongoDB",
      "JWT",
    ],
    date: "2025",
    links: [
      {
        name: "Live Demo",
        url: "https://jobifyy.com",
      },
      {
        name: "Private Repository",
        url: "#",
      },
    ],
    images: [
      {
        src: "/jobifyy/landing.png",
        alt: "Jobifyy landing page",
      },
      {
        src: "/jobifyy/about.png",
        alt: "Jobifyy about section",
      },
      {
        src: "/jobifyy/online-service.png",
        alt: "Jobifyy online services",
      },
      {
        src: "/jobifyy/inPerson.png",
        alt: "Jobifyy in-person services",
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
      "Stripe API",
      "Node.js",
      "Express.js",
      "GraphQL",
      "Socket.io",
      "MongoDB",
      "JWT",
    ],
    date: "2025",
    links: [
      {
        name: "Live Demo",
        url: "https://nsevensecurity.com",
      },
      {
        name: "Private Repository",
        url: "#",
      },
    ],
    images: [
      {
        src: "/servifi/landing.png",
        alt: "Servifi landing page",
      },
      {
        src: "/servifi/services.png",
        alt: "Servifi services overview",
      },
      {
        src: "/servifi/booking-1.png",
        alt: "Servifi booking interface",
      },
      {
        src: "/servifi/booking-2.png",
        alt: "Servifi booking system",
      },
      {
        src: "/servifi/booking-3.png",
        alt: "Servifi booking workflow",
      },
      {
        src: "/servifi/bookings.png",
        alt: "Servifi dashboard bookings page",
      },
      {
        src: "/servifi/dashboard-1.png",
        alt: "Servifi dashboard calendar view",
      },
      {
        src: "/servifi/dashboard-2.png",
        alt: "Servifi dashboard overview page",
      },
      {
        src: "/servifi/dashboard-3.png",
        alt: "Servifi dashboard overview page",
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
      "FFmpeg",
      "WebRTC",
      "Stripe API",
      "Twilio API",
      "Node.js",
      "Express.js",
      "GraphQL",
      "Socket.io",
      "MongoDB",
      "JWT",
    ],
    date: "2025",
    links: [
      {
        name: "Live Demo",
        url: "https://tt.mlxsoft.com/",
      },
      {
        name: "Private Repository",
        url: "#",
      },
    ],
    images: [
      {
        src: "/talent-tube/landing.png",
        alt: "Talent-Tube landing page",
      },
      {
        src: "/talent-tube/foryou.png",
        alt: "Talent-Tube for you page",
      },
      {
        src: "/talent-tube/suggested.png",
        alt: "Talent-Tube suggested talents",
      },
      {
        src: "/talent-tube/chat.png",
        alt: "Talent-Tube chat interface",
      },
      {
        src: "/talent-tube/blogs.png",
        alt: "Talent-Tube blogs section",
      },
    ],
  },
  {
    title: "Tuneit",
    description:
      "Mobile app connecting users with services, fully created by me. Handles all features and flows, including real-time updates for service notifications.",
    techStack: [
      "React Native",
      "Expo",
      "AsyncStorage",
      "Node.js",
      "Express.js",
      "GraphQL",
      "Socket.io",
      "MongoDB",
      "JWT",
    ],
    date: "2025",
    links: [
      {
        name: "Tuneit App",
        url: "https://github.com/sirajahmedx/tuneit-app",
      },
      {
        name: "Tuneit Web",
        url: "https://github.com/sirajahmedx/tuneit-web",
      },
      {
        name: "Tuneit API",
        url: "https://github.com/sirajahmedx/tuneit-api",
      },
    ],
    images: [
      {
        src: "/tuneit/landing.png",
        alt: "Tuneit landing page",
      },
      {
        src: "/tuneit/signin.png",
        alt: "Tuneit sign in page",
      },
      {
        src: "/tuneit/signup.png",
        alt: "Tuneit sign up page",
      },
    ],
  },
  {
    title: "GitHub Bot",
    description:
      "GitHub automation toolkit with three standalone bots for following users, unfollowing users, and generating fake commits. Features rate limiting, progress persistence, and human-like behavior for safe automation.",
    techStack: ["Node.js", "GitHub API"],
    date: "2025",
    links: [
      {
        name: "GitHub",
        url: "https://github.com/sirajahmedx/bots",
      },
    ],
    images: [
      {
        src: "/bot/follow.png",
        alt: "GitHub Bot follow functionality",
      },
      {
        src: "/bot/follow-2.png",
        alt: "GitHub Bot follow interface",
      },
      {
        src: "/bot/unfollow.png",
        alt: "GitHub Bot unfollow functionality",
      },
    ],
  },
  {
    title: "Sensify (School Project)",
    description:
      "React Native mobile app suite with sensor-based tools for measuring light, detecting magnets, leveling surfaces, and more.",
    techStack: ["React Native", "Node.js", "Express.js", "MongoDB"],
    date: "2025",
    links: [
      {
        name: "GitHub",
        url: "https://github.com/sirajahmedx/sensify",
      },
    ],
    images: [],
  },
  {
    title: "Global Parcel Services GPS App",
    description:
      "GPS-based parcel tracking mobile app for efficient package delivery and tracking. Features real-time location updates, delivery status monitoring, and route optimization for delivery personnel.",
    techStack: ["React Native", "Node.js", "Express.js", "MongoDB"],
    date: "2025",
    links: [
      {
        name: "Google Play Store",
        url: "https://play.google.com/store/search?q=Global+Parcel+Services&c=apps",
      },
    ],
    images: [],
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
    <div className="space-y-8 md:space-y-10">
      {/* Header section with description */}
      <div className="rounded-3xl bg-[#F5F5F7] p-6 sm:p-8 dark:bg-[#1D1D1F]">
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span>{projectData.date}</span>
          </div>

          <p className="text-secondary-foreground font-sans text-base leading-relaxed md:text-lg text-pretty">
            {projectData.description}
          </p>

          {/* Tech stack */}
          <div className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <h3 className="text-sm tracking-wide text-neutral-500 dark:text-neutral-400">
                Technologies Used
              </h3>
              <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
            </div>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              {projectData.techStack.map((tech, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 hover:shadow-md transition-shadow"
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
        <div className="mb-16 md:mb-24">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm tracking-wide text-neutral-500 dark:text-neutral-400">
              Project Links
            </h3>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
          </div>
          <Separator className="my-3 sm:my-4" />
          <div className="space-y-3 sm:space-y-4">
            {projectData.links.map((link, index) => (
              <motion.a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-neutral-200 dark:border-neutral-600"
              >
                <span className="font-medium capitalize text-neutral-800 dark:text-neutral-200 text-sm sm:text-base">
                  {link.name}
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 text-neutral-600 dark:text-neutral-400" />
              </motion.a>
            ))}
          </div>
        </div>
      )}

      {/* Images gallery */}
      {projectData.images && projectData.images.length > 0 && (
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <h3 className="text-sm tracking-wide text-neutral-500 dark:text-neutral-400">
              Project Gallery
            </h3>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
          </div>

          {projectData.images.length === 1 ? (
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
              <Image
                src={projectData.images[0].src || "/placeholder.svg"}
                alt={projectData.images[0].alt}
                fill
                className="object-cover transition-transform hover:scale-105"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {projectData.images.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-video overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 group cursor-pointer"
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
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
    title: "Jobifyy",
    description:
      "Jobifyy is a comprehensive service marketplace platform that connects service providers with clients. Features booking management, secure payments, and real-time chat functionality. Built with React, Next.js, GraphQL, and MongoDB for scalable performance.",
    gradient:
      "from-emerald-500/70 to-teal-600/70 dark:from-emerald-600/60 dark:to-teal-700/60",
    content: <ProjectContent project={{ title: "Jobifyy" }} />,
  },
  {
    category: "Service Platform",
    title: "Servifi",
    description:
      "Servifi is a comprehensive service platform connecting tradesmen with customers through advanced backend APIs. Features provider profiles, service listings, booking systems, and payment processing. Includes admin dashboards and real-time communication systems.",
    gradient:
      "from-amber-400/70 to-orange-500/70 dark:from-yellow-500/60 dark:to-amber-600/60",
    content: <ProjectContent project={{ title: "Servifi" }} />,
  },
  {
    category: "Talent Discovery App",
    title: "Talent-Tube",
    description:
      "Talent-Tube is a multi-platform talent discovery app combining video content and hiring capabilities. Features real-time chat system, user profiles, skill tagging, and content management. Built with React, Next.js, GraphQL, and Android native development.",
    gradient:
      "from-purple-500/70 to-pink-500/70 dark:from-purple-600/60 dark:to-pink-600/60",
    content: <ProjectContent project={{ title: "Talent-Tube" }} />,
  },
  {
    category: "Mechanic Services App",
    title: "Tuneit",
    description:
      "Tuneit is a full platform with both web app and mobile app that connects users with services. Built everything from scratch - it's 100% my idea and project. The web app uses Next.js with shadcn/ui, backend runs on Apollo Server with Node.js and GraphQL, mobile app is React Native, and everything stores in MongoDB. Features service browsing, provider profiles, booking systems, and real-time notifications.",
    gradient:
      "from-slate-400/70 to-slate-600/70 dark:from-slate-500/60 dark:to-slate-700/60",
    content: <ProjectContent project={{ title: "Tuneit" }} />,
  },
  {
    category: "Automation Tool",
    title: "GitHub Bot",
    description:
      "GitHub automation toolkit with three standalone bots for following users, unfollowing users, and generating fake commits. Features rate limiting, progress persistence, and human-like behavior for safe automation. Built with Node.js and GitHub API.",
    gradient:
      "from-gray-500/70 to-gray-700/70 dark:from-[#6E7681]/60 dark:to-[#484F58]/60",
    content: <ProjectContent project={{ title: "GitHub Bot" }} />,
  },
  {
    category: "Portfolio Website",
    title: "Portfolio Website",
    description:
      "Personal portfolio website showcasing my projects, skills, and experience as a full-stack developer. Features responsive design, dark/light theme toggle, interactive project cards, contact forms, and smooth animations. Built with Next.js, React, TypeScript, and Tailwind CSS for modern web development.",
    gradient:
      "from-blue-500/70 to-purple-500/70 dark:from-blue-600/60 dark:to-purple-600/60",
    content: <ProjectContent project={{ title: "Portfolio Website" }} />,
  },
  {
    category: "School Project",
    title: "Sensify",
    description:
      "React Native mobile app suite with sensor-based tools for measuring light, detecting magnets, leveling surfaces, and more. Features real-time sensor data processing and cross-platform compatibility. Built with React Native, Node.js, and MongoDB.",
    gradient:
      "from-cyan-400/70 to-blue-500/70 dark:from-cyan-500/60 dark:to-blue-500/60",
    content: <ProjectContent project={{ title: "Sensify (School Project)" }} />,
  },
  {
    category: "GPS Tracking App",
    title: "Global Parcel Services GPS App",
    description:
      "GPS-based parcel tracking mobile app for efficient package delivery and tracking. Features real-time location updates, delivery status monitoring, and route optimization for delivery personnel. Built with React Native, Node.js, Express.js, and MongoDB.",
    gradient:
      "from-green-500/70 to-emerald-500/70 dark:from-green-500/60 dark:to-emerald-600/60",
    content: (
      <ProjectContent project={{ title: "Global Parcel Services GPS App" }} />
    ),
  },
];
export const sideProjects = [
  {
    category: "Automation Tool",
    title: "GitHub Bot",
    gradient:
      "from-gray-600/70 to-gray-800/70 dark:from-gray-800 dark:to-gray-600",
    content: <ProjectContent project={{ title: "GitHub Bot" }} />,
  },
  {
    category: "School Project",
    title: "Sensify",
    gradient:
      "from-gray-300/70 to-gray-400/70 dark:from-white dark:to-gray-200",
    content: <ProjectContent project={{ title: "Sensify (School Project)" }} />,
  },
];

// Legacy export for backward compatibility
export const data = mainProjects.map((project) => ({
  ...project,
  src: undefined, // Remove src for legacy compatibility
}));

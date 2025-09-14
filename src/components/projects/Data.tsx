// import Image from 'next/image';
// import { Image as Img } from 'lucide-react';
// import { ChevronRight, Link } from 'lucide-react';
// import { Separator } from '@/components/ui/separator';
// import { url } from 'inspector';

// // Enhanced project content array with all projects
// const PROJECT_CONTENT = [
//   {
//     title: 'Jobify',
//     description:
//       'Full-stack platform for service providers and clients, featuring booking management, notifications, payments, and real-time chat. Web frontend, GraphQL API backend, socket server for real-time messaging, supports roles, categories, services, dashboards.',
//     techStack: [
//       'React',
//       'Next.js',
//       'Tailwind CSS',
//       'Apollo Client',
//       'Node.js',
//       'Express.js',
//       'GraphQL',
//       'Socket.io',
//       'MongoDB',
//       'JWT (auth.js)'
//     ],
//     date: '2024',
//     links: [
//       {
//         name: 'GitHub',
//         url: 'https://github.com/sirajahmedx',
//       },
//     ],
//     images: [
//       {
//         src: '/jobify1.png',
//         alt: 'Jobify landing page',
//       },
//       {
//         src: '/jobify2.png',
//         alt: 'Jobify dashboard',
//       },
//     ],
//   },
//   {
//     title: 'Tradesman',
//     description:
//       'Service platform connecting tradesmen with customers. Includes backend APIs for bookings, categories, payments, web dashboards, real-time chat, notifications, supplier management.',
//     techStack: [
//       'React',
//       'Next.js',
//       'Tailwind CSS',
//       'Apollo Client',
//       'Node.js',
//       'Express.js',
//       'GraphQL',
//       'Socket.io',
//       'MongoDB',
//       'JWT (auth.js)'
//     ],
//     date: '2024',
//     links: [
//       {
//         name: 'GitHub',
//         url: 'https://github.com/sirajahmedx',
//       },
//     ],
//     images: [
//       {
//         src: '/tradesman1.png',
//         alt: 'Tradesman dashboard',
//       },
//       {
//         src: '/tradesman2.png',
//         alt: 'Tradesman booking system',
//       },
//     ],
//   },
//   {
//     title: 'Talent-Tube',
//     description:
//       'Multi-platform talent discovery and hiring app, including video content (shorts), bookings, follow systems, notifications, and content management. Web frontend, Android mobile app, GraphQL backend, socket support for real-time features.',
//     techStack: [
//       'React',
//       'Next.js',
//       'Tailwind CSS',
//       'Apollo Client',
//       'Android (Kotlin/Java)',
//       'Node.js',
//       'Express.js',
//       'GraphQL',
//       'Socket.io',
//       'MongoDB',
//       'JWT (auth.js)'
//     ],
//     date: '2024',
//     links: [
//       {
//         name: 'GitHub',
//         url: 'https://github.com/sirajahmedx',
//       },
//     ],
//     images: [
//       {
//         src: '/talenttube1.png',
//         alt: 'Talent-Tube main interface',
//       },
//       {
//         src: '/talenttube2.png',
//         alt: 'Talent-Tube mobile app',
//       },
//     ],
//   },
//   {
//     title: 'Tuneit',
//     description:
//       'Mobile app connecting users with services, fully created by me. Handles all features and flows, including real-time updates for service notifications.',
//     techStack: [
//       'React Native',
//       'Node.js',
//       'Express.js',
//       'GraphQL',
//       'Socket.io',
//       'MongoDB',
//       'JWT (auth.js)'
//     ],
//     date: '2024',
//     links: [
//       {
//         name: 'GitHub',
//         url: 'https://github.com/sirajahmedx',
//       },
//     ],
//     images: [
//       {
//         src: '/tuneit1.png',
//         alt: 'Tuneit mobile app',
//       },
//       {
//         src: '/tuneit2.png',
//         alt: 'Tuneit service interface',
//       },
//     ],
//   },
//   {
//     title: 'GitHub Bot',
//     description:
//       'GitHub automation toolkit with three standalone bots for following users, unfollowing users, and generating fake commits. Features rate limiting, progress persistence, and human-like behavior for safe automation.',
//     techStack: [
//       'Node.js',
//       'GitHub API'
//     ],
//     date: '2024',
//     links: [
//       {
//         name: 'GitHub',
//         url: 'https://github.com/sirajahmedx',
//       },
//     ],
//     images: [
//       {
//         src: '/githubbot1.png',
//         alt: 'GitHub Bot interface',
//       },
//     ],
//   },
//   {
//     title: 'Sensify (School Project)',
//     description:
//       'React Native mobile app suite with sensor-based tools for measuring light, detecting magnets, leveling surfaces, and more.',
//     techStack: [
//       'React Native',
//       'Node.js',
//       'Express.js',
//       'MongoDB'
//     ],
//     date: '2024',
//     links: [
//       {
//         name: 'GitHub',
//         url: 'https://github.com/sirajahmedx',
//       },
//     ],
//     images: [
//       {
//         src: '/sensify1.png',
//         alt: 'Sensify sensor tools',
//       },
//     ],
//   },
// ];

// // Define interface for project prop
// interface ProjectProps {
//   title: string;
//   description?: string;
//   techStack?: string[];
//   date?: string;
//   links?: { name: string; url: string }[];
//   images?: { src: string; alt: string }[];
// }

// const ProjectContent = ({ project }: { project: ProjectProps }) => {
//   // Find the matching project data
//   const projectData = PROJECT_CONTENT.find((p) => p.title === project.title);

//   if (!projectData) {
//     return <div>Project details not available</div>;
//   }

//   return (
//     <div className="space-y-10">
//       {/* Header section with description */}
//       <div className="rounded-3xl bg-[#F5F5F7] p-8 dark:bg-[#1D1D1F]">
//         <div className="space-y-6">
//           <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
//             <span>{projectData.date}</span>
//           </div>

//           <p className="text-secondary-foreground font-sans text-base leading-relaxed md:text-lg">
//             {projectData.description}
//           </p>

//           {/* Tech stack */}
//           <div className="pt-4">
//             <h3 className="mb-3 text-sm tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
//               Technologies
//             </h3>
//             <div className="flex flex-wrap gap-2">
//               {projectData.techStack.map((tech, index) => (
//                 <span
//                   key={index}
//                   className="rounded-full bg-neutral-200 px-3 py-1 text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
//                 >
//                   {tech}
//                 </span>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Links section */}
//       {projectData.links && projectData.links.length > 0 && (
//         <div className="mb-24">
//           <div className="px-6 mb-4 flex items-center gap-2">
//             <h3 className="text-sm tracking-wide text-neutral-500 dark:text-neutral-400">
//               Links
//             </h3>
//             <Link className="text-muted-foreground w-4" />
//           </div>
//           <Separator className="my-4" />
//           <div className="space-y-3">
//             {projectData.links.map((link, index) => (
//                 <a
//                 key={index}
//                 href={link.url}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="group bg-[#F5F5F7] flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-[#E5E5E7] dark:bg-neutral-800 dark:hover:bg-neutral-700"
//                 >
//                 <span className="font-light capitalize">{link.name}</span>
//                 <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
//                 </a>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Images gallery */}
//       {projectData.images && projectData.images.length > 0 && (
//         <div className="space-y-6">
//           <div className="grid grid-cols-1 gap-4">
//             {projectData.images.map((image, index) => (
//               <div
//                 key={index}
//                 className="relative aspect-video overflow-hidden rounded-2xl"
//               >
//                 <Image
//                   src={image.src}
//                   alt={image.alt}
//                   fill
//                   className="object-cover transition-transform"
//                 />
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Main data export with updated content
// export const data = [
//   {
//     category: 'Full-Stack Platform',
//     title: 'Jobify',
//     src: '/jobify1.png',
//     content: <ProjectContent project={{ title: 'Jobify' }} />,
//   },
//   {
//     category: 'Service Platform',
//     title: 'Tradesman',
//     src: '/tradesman1.png',
//     content: <ProjectContent project={{ title: 'Tradesman' }} />,
//   },
//   {
//     category: 'Talent Discovery App',
//     title: 'Talent-Tube',
//     src: '/talenttube1.png',
//     content: <ProjectContent project={{ title: 'Talent-Tube' }} />,
//   },
//   {
//     category: 'Mobile App',
//     title: 'Tuneit',
//     src: '/tuneit1.png',
//     content: <ProjectContent project={{ title: 'Tuneit' }} />,
//   },
//   {
//     category: 'Automation Tool',
//     title: 'GitHub Bot',
//     src: '/githubbot1.png',
//     content: <ProjectContent project={{ title: 'GitHub Bot' }} />,
//   },
//   {
//     category: 'School Project',
//     title: 'Sensify',
//     src: '/sensify1.png',
//     content: <ProjectContent project={{ title: 'Sensify' }} />,
//   },
// ];

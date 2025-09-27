"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Github, Mail, Linkedin } from "lucide-react";

export function Contact() {
  const contactInfo = {
    name: "Siraj Ahmed",
    email: "sirajahmedxdev@gmail.com",
    handle: "@sirajahmedx",
    socials: [
      {
        name: "GitHub",
        url: "https://github.com/sirajahmedx",
        icon: <Github className="h-5 w-5" />,
        username: "sirajahmedx",
      },
      {
        name: "LinkedIn",
        url: "#", // Placeholder
        icon: <Linkedin className="h-5 w-5 opacity-50" />,
        username: "Coming Soon",
        disabled: true, // Optional flag to style differently
      },
      {
        name: "Discord",
        url: "https://discord.com/users/your-discord-id", // replace with actual URL
        // icon: <Discord className="h-5 w-5" />,
        username: "sirajahmedx#1234",
      },
      {
        name: "Email",
        url: "mailto:sirajahmedxdev@gmail.com",
        icon: <Mail className="h-5 w-5" />,
        username: "sirajahmedxdev@gmail.com",
      },
    ],
  };

  const openLink = (url: string, disabled?: boolean) => {
    if (!disabled) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="mx-auto mt-8 w-full">
      <div className="bg-accent w-full overflow-hidden rounded-3xl px-6 py-8 font-sans sm:px-10 md:px-16 md:py-12">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-foreground text-3xl font-semibold md:text-4xl">
            Contacts
          </h2>
          <span className="mt-2 sm:mt-0 text-muted-foreground">
            {contactInfo.handle}
          </span>
        </div>

        {/* Email Section */}
        <div className="mt-8 flex flex-col md:mt-10">
          <div
            className="group mb-5 cursor-pointer"
            onClick={() => openLink(`mailto:${contactInfo.email}`)}
          >
            <div className="flex items-center gap-1">
              <span className="text-base font-medium text-blue-500 hover:underline sm:text-lg">
                {contactInfo.email}
              </span>
              <ChevronRight className="h-5 w-5 text-blue-500 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {contactInfo.socials.map((social) => (
              <button
                key={social.name}
                onClick={() => openLink(social.url, social.disabled)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                  ${
                    social.disabled
                      ? "text-muted-foreground cursor-not-allowed"
                      : "text-muted-foreground hover:bg-foreground hover:text-background"
                  }`}
                title={social.name}
              >
                {social.icon}
                <span>{social.username}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;

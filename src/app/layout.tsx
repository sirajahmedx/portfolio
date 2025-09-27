import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Use system fonts instead of Google Fonts to avoid network issues
// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-inter",
//   display: "swap",
//   fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
// });

export const metadata: Metadata = {
  title: "Siraj Ahmed - Full-Stack Developer",
  description:
    "Interactive portfolio of Siraj Ahmed, a 16-year-old full-stack developer from Pakistan specializing in React, Node.js, and GraphQL",
  keywords: [
    "Siraj Ahmed",
    "Portfolio",
    "Full-Stack Developer",
    "React",
    "Node.js",
    "GraphQL",
    "Pakistan",
    "Web Development",
    "Mobile Development",
    "Next.js",
  ],
  authors: [
    {
      name: "Siraj Ahmed",
      url: "https://sirajahmedx.github.io",
    },
  ],
  creator: "Siraj Ahmed",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sirajahmedx.github.io",
    title: "Siraj Ahmed - Full-Stack Developer",
    description:
      "Interactive portfolio of Siraj Ahmed, a talented full-stack developer from Pakistan",
    siteName: "Siraj Ahmed Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Siraj Ahmed - Full-Stack Developer",
    description:
      "Interactive portfolio of Siraj Ahmed, a talented full-stack developer from Pakistan",
    creator: "@sirajahmedx",
  },
  icons: {
    icon: [
      {
        url: "/favicon.png",
        sizes: "any",
      },
    ],
    shortcut: "/favicon.png?v=2",
    apple: "/apple-touch-icon.svg?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link rel="icon" href="/favicon.svg" sizes="any" />
      </head>
      <body
        className={cn("bg-background min-h-screen font-sans antialiased")}
        style={{ transform: "scale(0.95)", transformOrigin: "top center" }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true} // Enable system theme detection
        >
          <Header />
          <main
            className="flex flex-col overflow-auto"
            // style={{ minHeight: "calc(100dvh / 0)" }} // Adjust for 5% scale reduction
          >
            {children}
            <SpeedInsights />
          </main>
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

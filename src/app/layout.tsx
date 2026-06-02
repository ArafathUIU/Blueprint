import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blueprint — AI Product Manager Agent",
  description:
    "An autonomous AI agent that takes a raw product idea and produces a complete product package: market research, competitive analysis, user stories, wireframes, PRDs, and development roadmap.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
              <a href="/" className="flex items-center gap-2">
                <img src="/icon.svg" alt="Blueprint" className="h-8 w-8" />
                <img
                  src="/logo-horizontal.svg"
                  alt="Blueprint"
                  className="hidden h-7 sm:block dark:hidden"
                />
                <img
                  src="/logo-dark.svg"
                  alt="Blueprint"
                  className="hidden h-7 sm:hidden dark:sm:block"
                />
              </a>
              <div className="flex-1" />
              <Link
                href="/new"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                New Blueprint
              </Link>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}

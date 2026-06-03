import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { NeuralBackground } from "@/components/neural-background";
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
      <body className="relative min-h-full flex flex-col bg-background text-foreground">
        {/* Neural network background — subtle, always present */}
        <NeuralBackground />

        <TooltipProvider>
          <header className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
              <Link href="/" className="flex items-center gap-2 no-underline">
                <span className="font-sans text-xl font-bold tracking-tight text-white">
                  blueprint
                </span>
                <span className="mt-0.5 h-2 w-2 rounded-full bg-red-500" />
              </Link>
              <div className="flex-1" />
              <Link
                href="/new"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                New Blueprint
              </Link>
            </div>
          </header>
          <main className="relative z-10 flex-1">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}

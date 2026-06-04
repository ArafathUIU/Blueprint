import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { NeuralBackground } from "@/components/neural-background";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Blueprint — AI Product Manager Agent",
    template: "%s | Blueprint",
  },
  description:
    "An autonomous AI agent that takes a raw product idea and produces market research, user stories, wireframes, a PRD, and a development roadmap — all in one continuous workflow.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Blueprint — AI Product Manager Agent",
    description:
      "From idea to roadmap in one workflow. Research. Stories. Wireframes. PRD. Roadmap.",
    url: "https://blueprint-pm.onrender.com",
    siteName: "Blueprint",
    type: "website",
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
      className="h-full antialiased"
    >
      <body className="relative min-h-full flex flex-col bg-background text-foreground">
        <NeuralBackground />

        <TooltipProvider>
          <header className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
              <Link href="/" className="flex items-center gap-2 no-underline" aria-label="Blueprint home">
                <span className="font-sans text-lg font-medium tracking-tight text-white">
                  blueprint
                </span>
                <span className="mt-0.5 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
              </Link>
              <Link href="/projects" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white" aria-label="View all projects">
                Projects
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
          <footer className="relative z-10 border-t border-white/5 py-4 text-center">
            <Link href="/terms" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Terms & Privacy
            </Link>
          </footer>
        </TooltipProvider>
      </body>
    </html>
  );
}

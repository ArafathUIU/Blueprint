export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <img
          src="/logo-vertical.svg"
          alt="Blueprint"
          className="mb-8 h-64 w-auto"
        />
        <p className="mb-10 max-w-lg text-lg leading-relaxed text-muted-foreground">
          An autonomous AI agent that takes a raw product idea and produces a
          complete product package: market research, competitive analysis, user
          stories, wireframes, PRDs, and development roadmap — all in one
          continuous workflow.
        </p>
        <a
          href="/new"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Start a new product blueprint
        </a>
      </section>
    </div>
  );
}

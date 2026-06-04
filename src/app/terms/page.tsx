import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Privacy",
};

export default function TermsPage() {
  return (
    <div className="relative z-10 mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold text-white mb-6">Terms & Privacy</h1>

      <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-white/70 mb-2">Data Storage</h2>
          <p>
            Blueprint stores your project data (ideas, research, stories, wireframes, PRDs, and roadmaps)
            locally on the server as JSON files. No data is sent to third-party services except for AI
            generation calls made to OpenCode Go (opencode.ai) for processing your product ideas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white/70 mb-2">AI Processing</h2>
          <p>
            Product ideas you submit are sent to OpenCode Go&apos;s API for AI processing. OpenCode Go
            operates under a zero-retention policy — your data is not stored, logged, or used for model
            training. See{" "}
            <a href="https://opencode.ai/docs/go/#privacy" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
              OpenCode Go Privacy
            </a>{" "}
            for details.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white/70 mb-2">No Authentication</h2>
          <p>
            Blueprint currently does not require user accounts. All projects are stored on the server
            and are accessible to anyone with the URL. Do not submit sensitive or proprietary information.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white/70 mb-2">Rate Limiting</h2>
          <p>
            API endpoints are rate-limited to 10 requests per minute per IP address to prevent abuse.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white/70 mb-2">Disclaimer</h2>
          <p>
            Blueprint is an AI-powered tool. Generated market research, competitor analysis, and other
            outputs are AI-generated estimates and should be verified independently before making business
            decisions. Blueprint is provided &quot;as is&quot; without warranty of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white/70 mb-2">Contact</h2>
          <p>
            Built by{" "}
            <a href="https://github.com/ArafathUIU" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
              Md. Arafath Hossain Akash
            </a>
            . For issues or questions, open an issue on{" "}
            <a href="https://github.com/ArafathUIU/Blueprint" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

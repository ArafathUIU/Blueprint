# Blueprint — System Architecture

> Last updated: 2026-06-03  
> This document is a living reference. Update it whenever the architecture changes.

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER (Client)                              │
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌─────────────┐  │
│  │ /        │    │ /new     │    │ /projects/   │    │ /projects/  │  │
│  │ Landing  │    │ Idea     │    │ [id]         │    │ [id]/export │  │
│  │ Page     │    │ Input    │    │ Project View │    │ (client)    │  │
│  └────┬─────┘    └────┬─────┘    └──────┬───────┘    └─────────────┘  │
│       │               │                │                               │
└───────┼───────────────┼────────────────┼───────────────────────────────┘
        │               │                │
        ▼               ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS SERVER (Port 3000)                       │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                        API ROUTES (ƒ dynamic)                      │ │
│  │                                                                   │ │
│  │  GET  /api/projects              → listProjects()                 │ │
│  │  POST /api/projects              → createProject(idea, name)      │ │
│  │  GET  /api/projects/[id]         → getProject(id)                 │ │
│  │  POST /api/projects/[id]/research  → researchAgent(idea)          │ │
│  │  POST /api/projects/[id]/stories   → storyAgent(idea, research)   │ │
│  │  POST /api/projects/[id]/wireframes→ wireframeAgent(stories)      │ │
│  │  POST /api/projects/[id]/prd       → prdAgent(idea, ...)          │ │
│  │  POST /api/projects/[id]/roadmap   → roadmapAgent(stories)        │ │
│  │  POST /api/projects/[id]/pipeline  → runFullPipeline(project)     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     AGENT LAYER (src/lib/agents/)                  │ │
│  │                                                                   │ │
│  │  researcher.ts     story-gen.ts    wireframe-gen.ts               │ │
│  │       │                 │                │                        │ │
│  │  prd-gen.ts       roadmap-gen.ts    pipeline.ts (orchestrator)    │ │
│  └───────────────────────────┬───────────────────────────────────────┘ │
│                              │                                          │
│  ┌───────────────────────────▼───────────────────────────────────────┐ │
│  │                    AI CLIENT (src/lib/ai.ts)                       │ │
│  │                                                                   │ │
│  │  Provider: @ai-sdk/openai-compatible                              │ │
│  │  Base URL: https://opencode.ai/zen/go/v1/chat/completions         │ │
│  │  Model:    deepseek-v4-pro                                        │ │
│  │  Auth:     Bearer OPENCODE_GO_API_KEY                             │ │
│  │                                                                   │ │
│  │  Functions:                                                        │ │
│  │    runAgent({ systemPrompt, userPrompt, temperature }) → string   │ │
│  │    runAgentStructured({ ...schema }) → T (parsed JSON)            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    DATA STORE (src/lib/store.ts)                   │ │
│  │                                                                   │ │
│  │  Type:     File-based JSON (data/*.json)                          │ │
│  │  Functions: listProjects, getProject, saveProject,               │ │
│  │            createProject, updateProject                           │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

Blueprint follows a clean **four-layer architecture** that separates concerns from top to bottom. The user interacts with the **Browser** through three pages — landing, idea input, and project view — which communicate with the Next.js server through REST API calls. Inside the server, incoming requests hit the **API Route Layer** first, where each route validates inputs and delegates work to the appropriate agent. The **Agent Layer** contains five specialized AI agents, each with a distinct system prompt and structured output schema. All agents funnel through a single **AI Client** (`src/lib/ai.ts`) that abstracts away the provider details — currently OpenCode Go with the DeepSeek V4 Pro model. Results from each agent call are persisted to the **Data Store**, a file-based JSON store that requires zero database setup, making the entire system portable and easy to deploy. The store is intentionally simple: one JSON file per project, stored under `data/{uuid}.json`, with CRUD operations exposed through a small set of functions.

The design principle behind this layering is **dependency inversion**: the API routes know about agents, but agents don't know about HTTP. Agents know about the AI client, but the AI client doesn't know about any specific agent. This means we can swap the LLM provider, change the storage backend, or add new agents without touching unrelated code.

---

## 2. Data Flow (End-to-End Pipeline)

```
User types idea at /new
        │
        ▼
┌──────────────────┐
│ 1. Create Project │  POST /api/projects
│    Status: draft   │  → store.ts: createProject()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. Research Agent │  POST /api/projects/:id/research
│    Status: resear-│  → researcher.ts: researchAgent(idea)
│    ching          │  → LLM call (system prompt + idea)
│                   │  → Returns: MarketResearch (JSON)
│                   │  → store.ts: updateProject()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. Story Agent   │  POST /api/projects/:id/stories
│    Status: gener- │  → story-gen.ts: storyAgent(idea, researchSummary)
│    ating_stories  │  → LLM call (system prompt + context)
│                   │  → Returns: UserStory[] (JSON)
│                   │  → store.ts: updateProject()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. Wireframe     │  POST /api/projects/:id/wireframes
│    Agent          │  → wireframe-gen.ts: wireframeAgent(stories)
│    Status: gener- │  → LLM call (system prompt + top 8 stories)
│    ating_wirefram.│  → Returns: Wireframe[] with inline SVG
│                   │  → store.ts: updateProject()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. PRD Agent     │  POST /api/projects/:id/prd
│    Status: gener- │  → prd-gen.ts: prdAgent(idea, research, stories, wireframes)
│    ating_prd      │  → LLM call (system prompt + full context)
│                   │  → Returns: PRD (JSON)
│                   │  → store.ts: updateProject()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 6. Roadmap Agent  │  POST /api/projects/:id/roadmap
│    Status: complete│  → roadmap-gen.ts: roadmapAgent(stories)
│                   │  → LLM call (system prompt + story summary)
│                   │  → Returns: RoadmapPhase[] (JSON)
│                   │  → store.ts: updateProject()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 7. Redirect       │  Client: router.push(`/projects/${id}`)
│    to Project View│  → page.tsx: getProject(id) renders all artifacts
└──────────────────┘
```

The pipeline is a **sequential, deterministic chain** of seven steps. It begins when the user submits a product idea on the `/new` page. The frontend first creates a project record with a `draft` status, then iterates through five agent endpoints in a fixed order. Each step is a blocking POST request — the UI waits for the current step to complete before triggering the next.

This sequential design is intentional. The Story Generator needs the research summary to create persona-mapped stories. The Wireframe Generator needs finalized stories to know which screens to design. The PRD Agent needs research, stories, and wireframes to assemble a complete document. The Roadmap Agent needs stories to assign phases. **No step can run before its dependencies are ready.** Attempting parallelism here would produce lower-quality output because later agents would lack the context only prior agents can provide.

After all five agents succeed, the project status becomes `complete` and the client redirects to the project view at `/projects/[id]`, which is a server-side rendered page that reads the project JSON from disk and renders all artifacts inline.

### Pipeline Orchestration

The `pipeline.ts` file uses an async generator (`runFullPipeline`) that yields progress events:

```typescript
for await (const event of runFullPipeline(project)) {
  // event.step    = "research" | "stories" | "wireframes" | "prd" | "roadmap"
  // event.status  = "running" | "done" | "error"
  // event.project = updated Project object
}
```

The async generator pattern was chosen over a simple async function because it enables **progressive yielding of state**. Each time an agent completes (or fails), the generator yields the updated project object back to the caller. This is the foundation for future SSE (Server-Sent Events) streaming — instead of waiting for all steps to finish, we can push progress events to the client in real time. For now, the `/api/projects/:id/pipeline` endpoint consumes all yielded events synchronously and returns the final project. The `/new` page takes a simpler approach: it calls each agent endpoint individually from the client, which gives us fine-grained progress updates without SSE infrastructure.

Each step:
1. Updates project status in store
2. Calls the respective agent
3. Saves the result to store
4. On error: saves error to project, stops pipeline

Error handling is **fail-fast per step**. If the Research Agent fails, the error is saved to the project's `error` field, the status is set to `error`, and the pipeline stops. No subsequent agents are invoked. The user can see which step failed in the UI and either retry that step individually or restart from the beginning. Partial results from successful steps are preserved on disk, so no work is lost.

---

## 3. Agent Design

Every agent follows the same pattern:

```typescript
// 1. SYSTEM PROMPT: Defines the agent's role, output format, and rules
const SYSTEM_PROMPT = `You are an expert X. Output ONLY valid JSON...`;

// 2. AGENT FUNCTION: Takes input context, calls LLM, returns parsed result
export async function xAgent(input: InputType): Promise<OutputType> {
  return runAgentStructured<OutputType>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Context: ${input}`,
    schema: "OutputType",
  });
}
```

This pattern ensures every agent is **self-contained and testable in isolation**. Each agent file exports a single async function and a private system prompt constant. The system prompt is the agent's "personality" — it defines the agent's expertise, output format, constraints, and quality rules. The user prompt carries the dynamic context (product idea, research results, story list, etc.).

The `runAgentStructured` helper in `ai.ts` handles the LLM call, response parsing, and JSON extraction. It wraps the Vercel AI SDK's `generateText` function and adds a **JSON extraction layer** that handles common LLM output patterns: code-fenced JSON blocks (` ```json ...``` `), bare JSON objects, and inline JSON buried in text. If parsing fails, it throws a descriptive error with a snippet of the raw response for debugging.

### Agent Details

| Agent | File | Input | Output | Avg Time |
|-------|------|-------|--------|----------|
| **Researcher** | `researcher.ts` | Product idea | `MarketResearch` (TAM, competitors, personas, viability) | ~60s |
| **Story Gen** | `story-gen.ts` | Idea + research summary | `UserStory[]` (10-15 stories with ACs, MoSCoW) | ~90s |
| **Wireframe** | `wireframe-gen.ts` | Top 8 stories | `Wireframe[]` (3 wireframes with inline SVG) | ~60-90s |
| **PRD** | `prd-gen.ts` | Idea + research + stories + wireframes | `PRD` (problem, goals, features, risks) | ~90s |
| **Roadmap** | `roadmap-gen.ts` | Stories | `RoadmapPhase[]` (3-4 phases with deliverables) | ~60s |

**Researcher Agent**: The entry point of the pipeline. It takes only the raw product idea and produces a comprehensive market analysis. Its system prompt instructs the LLM to estimate TAM/SAM/SOM with sources, identify 4-6 competitors with strengths and weaknesses, define 3-4 target personas, and assign a 0-100 viability score. The summary field provides a concise executive overview that downstream agents use as context.

**Story Generator Agent**: Receives both the original idea and the research summary. This dual-input approach ensures stories are grounded in market reality — personas identified in research become the actors in user stories, and competitive gaps become feature opportunities. Output is 10-15 stories organized into 3-5 epics, each with priority (P0/P1/P2) and MoSCoW classification, plus 2-4 specific, testable acceptance criteria.

**Wireframe Agent**: The most complex agent because it generates functional SVG markup. It receives only the top 8 stories (by priority) to keep token usage manageable. The system prompt enforces strict SVG constraints: viewBox 400×300, white background, only gray rects for UI blocks, one red CTA per screen, max 8 elements, no gradients or filters. Three wireframes are generated: typically a dashboard/home screen, a key feature screen, and a results/output screen.

**PRD Agent**: The synthesis agent. It receives all prior artifacts — idea, research, stories, and wireframes — and assembles a complete PRD. Its system prompt covers problem statement, goals with metrics and targets, key features, technical architecture, success metrics baseline-to-target, risk matrix with likelihood/impact/mitigation, and dependencies. This is the most token-intensive agent because it carries the full context window.

**Roadmap Agent**: The final agent. It receives only the user stories (not the full PRD) and generates a phased development plan. The system prompt enforces realistic timelines (4-6 weeks per phase), mandates that Phase 1 is always the MVP with P0/Must stories only, and requires all stories to be assigned to a phase. Output is 3-4 phases with specific deliverables per phase.

### Wireframe Optimization

The wireframe agent was the slowest step (4+ minutes initially). Optimizations:
- Only pass top 8 stories (not all 15)
- Strict SVG element limit: max 8 elements per wireframe
- No gradients, filters, or complex paths
- Only `rect`, `text`, `line` elements allowed
- This cut generation time to ~60-90s

The wireframe agent was initially the bottleneck. Full SVG generation with complex layouts, gradients, and detailed shapes took over 4 minutes per call because the LLM had to output hundreds of lines of SVG markup. Three optimizations brought this down to ~60 seconds: **(1)** Only the top 8 stories are passed as context — lower-priority stories don't drive UI design decisions. **(2)** A strict 8-element SVG cap was enforced in the system prompt — this prevents the LLM from over-designing with unnecessary decorative elements. **(3)** The system prompt explicitly bans gradients, filters, `<path>` elements, and complex shapes — only `<rect>`, `<text>`, and `<line>` are permitted. These constraints produce cleaner, more readable wireframes that resemble actual design mockups while dramatically reducing token output.

---

## 4. Data Model (src/lib/types.ts)

```typescript
Project {
  id: string
  idea: string
  name: string
  status: "draft" | "researching" | "generating_stories" | "generating_wireframes"
          | "generating_prd" | "generating_roadmap" | "complete" | "error"
  createdAt: ISO string
  updatedAt: ISO string
  research: MarketResearch | null
  stories: UserStory[] | null
  wireframes: Wireframe[] | null
  prd: PRD | null
  roadmap: RoadmapPhase[] | null
  error: string | null
}

MarketResearch {
  tam, sam, som: string
  trends: string[]
  competitors: { name, strength, weakness, differentiation }[]
  personas: { name, painPoint, willingnessToPay }[]
  viabilityScore: number (0-100)
  summary: string
}

UserStory {
  id: "US-XXX"
  epic: string
  story: "As a [persona], I want [feature] so that [benefit]"
  acceptanceCriteria: string[]
  priority: "P0" | "P1" | "P2"
  moscow: "Must" | "Should" | "Could" | "Wont"
}

Wireframe {
  id: "WF-XXX"
  title: string
  description: string
  svg: string (inline SVG markup)
  annotations: string[]
  linkedStories: string[] (references to UserStory IDs)
}

PRD {
  problemStatement: string
  goals: { goal, metric, target }[]
  targetUsers: string[]
  keyFeatures: { feature, description, priority }[]
  technicalArchitecture: string
  successMetrics: { metric, baseline, target }[]
  risks: { risk, likelihood, impact, mitigation }[]
  dependencies: string[]
}

RoadmapPhase {
  phase: string
  timeline: string (e.g. "Weeks 1-4")
  deliverables: string[]
  stories: string[] (references to UserStory IDs)
}
```

The data model is the **shared contract** between all layers of the application. It's defined in a single `types.ts` file and imported by agents, API routes, the store, and the frontend. The central entity is `Project`, which acts as an accumulator — it starts with just an `idea` and a `name`, and gradually fills with `research`, `stories`, `wireframes`, `prd`, and `roadmap` as each agent completes. The `status` field is a state machine that tracks exactly where in the pipeline the project sits, enabling the UI to show appropriate progress indicators. All date fields use ISO 8601 strings for JSON serialization compatibility.

Each sub-entity carries **domain-specific metadata** that enables rich rendering. `UserStory` includes both a priority level (P0–P2) and a MoSCoW classification (Must/Should/Could/Won't) — these are independent dimensions that serve different audiences: priority for engineering planning, MoSCoW for stakeholder communication. `Wireframe` includes a `linkedStories` array that creates traceability between UI elements and the requirements they fulfill. `PRD` carries a full risk matrix with likelihood, impact, and mitigation columns — enough to generate a proper risk register. `RoadmapPhase` links back to story IDs so the project view can show which stories ship in each phase.

The model uses **nullable fields** (`| null`) rather than optional fields (`?`) for agent outputs. This is intentional: a `null` value means "not yet generated", while an empty array `[]` would mean "generated but empty". These are semantically different states and the UI handles them differently.

---

## 5. Store Layer (src/lib/store.ts)

```
Storage: filesystem  →  data/*.json
Location: process.cwd()/data/
One file per project: data/{uuid}.json

API:
  listProjects()    → Project[]         (sorted by updatedAt desc)
  getProject(id)    → Project | null
  saveProject(p)    → void              (upsert, auto-sets updatedAt)
  createProject(i,n)→ Project           (generates UUID, saves)
  updateProject(i,u)→ Project           (partial update, saves)
```

The store is a **file-based JSON persistence layer** — intentionally minimal to keep the MVP dependency-free. Each project is stored as a single JSON file named `{uuid}.json` inside a `data/` directory at the project root. The directory is created automatically on first write. This design has several advantages: **(1)** Projects are human-readable — you can open any `.json` file in a text editor to inspect or manually fix a project. **(2)** No database server, Docker container, or connection string to configure. **(3)** Backup is trivial — copy the `data/` folder. **(4)** The entire store is portable across machines.

The trade-off is scalability: file-based storage doesn't support concurrent writes, indexing, or querying. For a single-user or small-team MVP, this is acceptable. The `getProject` function does a simple file read, and `listProjects` reads all files in the directory and sorts them by `updatedAt` descending. The `updateProject` function does a read-modify-write cycle, merging the provided partial updates into the existing project and automatically bumping the `updatedAt` timestamp.

The store is a **synchronous API** because Next.js route handlers run on the server and Node.js filesystem operations are fast enough for individual file reads. The `turbopackIgnore` comment on `process.cwd()` suppresses a Turbopack warning about filesystem operations in the build trace — this is expected for server-side code that reads from disk at runtime.

---

## 6. Frontend Component Tree

```
RootLayout (layout.tsx)
├── TooltipProvider
├── Header
│   ├── Logo (icon + wordmark, light/dark variants)
│   └── "New Blueprint" button → /new
├── [Page Content]
│
├── Landing Page (/)
│   ├── Hero Section
│   │   ├── Logo (vertical)
│   │   ├── Tagline
│   │   └── CTA Button → /new
│   └── Recent Projects Grid
│       └── ProjectCard × N
│           ├── Name + Status Badge
│           ├── Idea preview (2-line clamp)
│           └── Date
│
├── Idea Input Page (/new) [Client Component]
│   ├── Header text
│   ├── Project Name Input
│   ├── Idea Textarea
│   ├── Generate Button (disabled until idea entered)
│   └── Pipeline Progress Panel (shown during generation)
│       ├── Progress Bar (percentage + fraction)
│       ├── Step Indicators (5 icons with colors)
│       ├── Spinner (CSS animated SVG)
│       ├── Agent Message (cycling every 2.5s)
│       └── Error Display (if any)
│
└── Project View (/projects/[id]) [Server Component]
    ├── Header
    │   ├── Project Name + Status Badge
    │   ├── Idea description
    │   └── Export Buttons (client component)
    │       ├── Copy Markdown
    │       ├── Download .md
    │       └── Print / Save PDF
    ├── Market Research Section
    │   ├── Stat Cards (TAM, SAM, SOM, Score)
    │   ├── Summary Card
    │   ├── Trends Badges
    │   └── Competitors Table
    ├── User Stories Section
    │   └── Story Cards × N
    │       ├── ID + Epic Badge + Priority Badge + MoSCoW Badge
    │       ├── Story text
    │       └── Acceptance Criteria (bullet list)
    ├── Wireframes Section
    │   └── Wireframe Cards × N
    │       ├── Title
    │       ├── Description
    │       ├── SVG (dangerouslySetInnerHTML)
    │       └── Annotations
    ├── PRD Section
    │   ├── Problem Statement Card
    │   ├── Goals Table
    │   ├── Features Table
    │   ├── Metrics Table
    │   └── Risks Table
    └── Roadmap Section
        └── Phase Cards × N
            ├── Phase Name + Timeline Badge
            ├── Deliverables List
            └── Linked Story IDs
```

The component tree reflects a **hybrid rendering strategy** that leverages Next.js App Router's strengths. The landing page (`/`) and project view (`/projects/[id]`) are **Server Components** — they fetch data on the server (from the file store) and render static HTML, resulting in fast page loads and SEO-friendly content. The idea input page (`/new`) is a **Client Component** because it needs interactive state: form inputs, progress tracking, and sequential API calls.

The `RootLayout` is shared across all pages and provides: **(1)** The sticky header with the LEGO brick logo (light/dark variants based on system preference) and a "New Blueprint" CTA button. **(2)** A `TooltipProvider` wrapper required by shadcn/ui's tooltip component. **(3)** The Geist font family loaded via `next/font/google`.

The **Idea Input Page** is the most interactive surface. It manages five pieces of state: the idea text, project name, loading flag, current pipeline step, completed steps set, agent message, and error. During generation, the form inputs are replaced by a rich progress panel showing a percentage bar, five color-coded step indicators (🔍 blue → 📋 amber → 🎨 purple → 📄 green → 🗺 cyan), a CSS-animated SVG spinner, and a cycling agent message that updates every 2.5 seconds to simulate the agent "thinking" — this dramatically reduces perceived wait time.

The **Project View** is organized into collapsible sections, each mapped to an agent output. The Market Research section renders stat cards in a responsive 2-column grid, trends as badge chips, and competitors in a styled table. User Stories are rendered as cards with color-coded priority and MoSCoW badges — `Must` stories get a red-tinted border, `Should` stories amber, `Could` stories blue, and `Wont` stories gray. Wireframes use `dangerouslySetInnerHTML` to render the LLM-generated SVG directly — this is safe because we trust our own LLM output and there's no user-generated content in the SVG pipeline. The PRD section uses multiple tables (goals, features, metrics, risks) and the Roadmap section renders phase cards with a timeline badge and deliverables list.

---

## 7. Theme System

```
Colors (OKLCH color space via Tailwind v4 CSS variables):

  Light Mode:
    --background:   oklch(1 0 0)              → white
    --foreground:   oklch(0.145 0 0)          → near-black
    --primary:      oklch(0.55 0.24 27)       → #DC2626 (red)
    --primary-fg:   oklch(0.985 0 0)          → white
    --muted:        oklch(0.97 0 0)           → light gray
    --muted-fg:     oklch(0.556 0 0)          → medium gray
    --border:       oklch(0.922 0 0)          → light border
    --ring:         oklch(0.55 0.24 27)       → red focus ring
    --destructive:  oklch(0.55 0.24 27)       → red

  Dark Mode (.dark):
    --background:   oklch(0.145 0 0)         → near-black
    --foreground:   oklch(0.985 0 0)         → white
    --primary:      oklch(0.55 0.24 27)      → red (same)
    --muted:        oklch(0.269 0 0)         → dark gray

Fonts:
  Sans:  Geist (variable)
  Mono:  Geist Mono (variable)
```

The theme is defined using **OKLCH color space** — the modern standard for perceptually uniform color manipulation. Unlike hex or RGB, OKLCH separates lightness (L), chroma (C), and hue (H), making it predictable when creating light/dark variants. The primary red (`oklch(0.55 0.24 27)`) maps to approximately `#DC2626` and is used consistently across badges, buttons, progress bars, and focus rings in both light and dark mode — the hue and chroma stay the same, only the lightness changes.

The theme uses Tailwind CSS v4's `@theme inline` directive to register CSS custom properties as Tailwind design tokens. Every color variable (`--background`, `--foreground`, `--primary`, `--muted`, etc.) is registered so it can be used as a Tailwind utility class: `bg-background`, `text-foreground`, `border-primary`. The shadcn/ui base layer applies `@apply border-border outline-ring/50` globally, ensuring all elements inherit the correct border and focus ring colors automatically.

Dark mode is triggered by the `.dark` class on any ancestor element — Next.js handles this through the `prefers-color-scheme` media query if no manual toggle is present. Both Geist Sans and Geist Mono are loaded as variable fonts via `next/font/google`, with CSS custom properties (`--font-sans`, `--font-geist-mono`) wired into the Tailwind `@theme inline` block.

---

## 8. Environment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENCODE_GO_API_KEY` | Yes | — | API key from https://opencode.ai/go |
| `DATA_DIR` | No | `./data` | Directory for project JSON files |

The application requires exactly **one environment variable** to function: `OPENCODE_GO_API_KEY`. This is the API key for the OpenCode Go subscription ($10/month) that provides access to the DeepSeek V4 Pro model. Without this key, all agent calls will fail with a clear error message. The key is stored in `.env.local` (gitignored) and injected by Next.js at build time and runtime. An `.env.example` file is committed to the repo so new developers know what to configure.

`DATA_DIR` is an optional override for the project storage location. It defaults to `./data/` relative to the project root. This can be changed to an absolute path for deployment scenarios where the project directory is read-only.

---

## 9. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-02 | Use Next.js 16 App Router | Latest stable; server components for data fetching |
| 2026-06-02 | File-based JSON store instead of DB | Zero setup for MVP; projects are small files |
| 2026-06-02 | Sequential pipeline (not parallel) | Each agent depends on prior output |
| 2026-06-02 | No authentication | Deferred to Phase 3; MVP is single-user |
| 2026-06-02 | OpenCode Go (deepseek-v4-pro) over OpenAI | $10/mo flat rate vs per-token; good quality |
| 2026-06-02 | shadcn/ui base-nova style | Clean, modern defaults; full Tailwind v4 support |
| 2026-06-02 | Client-side Markdown export | Instant; no server processing needed |
| 2026-06-03 | Wireframe agent: limit to 8 SVG elements | Cut generation from 4+ min to ~60s |
| 2026-06-03 | Wireframe agent: only pass top 8 stories | Reduced token usage without quality loss |
| 2026-06-03 | LEGO brick icon instead of diamond nodes | User preference; represents "building blocks" |
| 2026-06-03 | Animated progress with cycling messages | Reduces user anxiety during long AI calls |
| 2026-06-03 | `dangerouslySetInnerHTML` for wireframe SVG | Simple rendering; SVGs are LLM-generated (trusted) |

Every architectural decision in this project was made with the **MVP-first principle**: build the simplest thing that works, defer complexity to later phases. The decision log captures the date and rationale for each choice so future contributors understand why things are the way they are.

The most consequential decision was adopting **OpenCode Go over OpenAI's API**. At $10/month flat rate with generous limits (3,450 requests per 5 hours on DeepSeek V4 Pro), it makes the application financially viable for solo PMs. The per-token pricing of OpenAI would make a full pipeline (5 LLM calls) cost $0.50-$2.00 per run — prohibitive for frequent use. The trade-off is slightly slower response times and no access to proprietary models like GPT-4, but DeepSeek V4 Pro's quality is more than sufficient for structured PM outputs.

The **file-based store** decision defers database complexity entirely. A typical project JSON file is 10-30KB, and even 100 projects would occupy ~3MB of disk space. The decision to defer authentication similarly keeps the codebase simple — there's one user, all projects are theirs, and there's no login screen, session management, or permission system to maintain.

The **wireframe optimization** decisions represent the most impactful performance improvement. By limiting the agent to 8 SVG elements and banning complex shapes, we reduced the slowest pipeline step from 4+ minutes to ~60 seconds. This was possible because low-fidelity wireframes don't need gradients, shadows, or detailed paths — clean gray rectangles with clear labels are actually more useful to PMs than over-designed mockups.

---

## 10. Known Limitations & Future Work

| Limitation | Mitigation / Future Plan |
|------------|--------------------------|
| No streaming progress | Add SSE endpoint for real-time pipeline status |
| LLM-generated SVGs may have syntax errors | Add SVG validation; fallback to description-only |
| No error retry for failed pipeline steps | Add retry button per step in UI |
| File store doesn't scale beyond single server | Migrate to SQLite or Postgres in Phase 3 |
| No user isolation (all projects visible) | Add auth in Phase 3 with per-user project scoping |
| Long pipeline time (~5-7 min total) | Explore parallel agents where possible; add progress streaming |
| Print export doesn't include SVGs well | Add `html2canvas` for better PDF export |

These limitations are **acknowledged trade-offs**, not bugs. Each has a clear mitigation plan that aligns with the phased roadmap. The most user-impacting limitation is the total pipeline time of 5-7 minutes — this is inherent to making five sequential LLM calls. The short-term fix is the animated progress UI (already implemented), which makes the wait feel shorter. The medium-term fix is SSE streaming (Phase 2), which will push per-token progress to the client. The long-term fix is exploring whether any agents can run in parallel — for example, wireframes and roadmap could theoretically run concurrently since they share only stories as input.

The SVG validation limitation is a quality-of-life issue: occasionally the LLM generates malformed SVG that renders as blank or broken in the browser. The planned fix is a lightweight SVG validation layer that checks for required attributes and falls back to a description-only card if the SVG is invalid.

File store scalability is a known constraint, but it's premature optimization for the current stage. The migration to SQLite (Phase 3) is straightforward because the store API (`listProjects`, `getProject`, `saveProject`, etc.) abstracts away the storage implementation — only `store.ts` needs to change, not the agents or routes that call it.

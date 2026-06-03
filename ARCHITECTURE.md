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

### Pipeline Orchestration

The `pipeline.ts` file uses an async generator (`runFullPipeline`) that yields progress events:

```typescript
for await (const event of runFullPipeline(project)) {
  // event.step    = "research" | "stories" | "wireframes" | "prd" | "roadmap"
  // event.status  = "running" | "done" | "error"
  // event.project = updated Project object
}
```

Each step:
1. Updates project status in store
2. Calls the respective agent
3. Saves the result to store
4. On error: saves error to project, stops pipeline

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

### Agent Details

| Agent | File | Input | Output | Avg Time |
|-------|------|-------|--------|----------|
| **Researcher** | `researcher.ts` | Product idea | `MarketResearch` (TAM, competitors, personas, viability) | ~60s |
| **Story Gen** | `story-gen.ts` | Idea + research summary | `UserStory[]` (10-15 stories with ACs, MoSCoW) | ~90s |
| **Wireframe** | `wireframe-gen.ts` | Top 8 stories | `Wireframe[]` (3 wireframes with inline SVG) | ~60-90s |
| **PRD** | `prd-gen.ts` | Idea + research + stories + wireframes | `PRD` (problem, goals, features, risks) | ~90s |
| **Roadmap** | `roadmap-gen.ts` | Stories | `RoadmapPhase[]` (3-4 phases with deliverables) | ~60s |

### Wireframe Optimization

The wireframe agent was the slowest step (4+ minutes initially). Optimizations:
- Only pass top 8 stories (not all 15)
- Strict SVG element limit: max 8 elements per wireframe
- No gradients, filters, or complex paths
- Only `rect`, `text`, `line` elements allowed
- This cut generation time to ~60-90s

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

---

## 8. Environment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENCODE_GO_API_KEY` | Yes | — | API key from https://opencode.ai/go |
| `DATA_DIR` | No | `./data` | Directory for project JSON files |

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

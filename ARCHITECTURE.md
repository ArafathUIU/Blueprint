# Blueprint — System Architecture

> Last updated: 2026-06-03  
> This document is a living reference. Update it whenever the architecture changes.

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER (Client)                              │
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────────┐    │
│  │ /        │    │ /new     │    │ /projects │    │ /projects/    │    │
│  │ Terminal │    │ SSE      │    │ List +    │    │ [id]          │    │
│  │ Hero     │    │ Stream   │    │ Delete    │    │ + Chat + Exp  │    │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └──────┬────────┘    │
│       │               │               │                  │              │
│       ▼               ▼               ▼                  ▼              │
│  ┌────────┐    ┌────────────┐  ┌───────────┐     ┌──────────────┐     │
│  │Static  │    │fetch + SSE │  │REST calls │     │REST + client │     │
│  │render  │    │reader      │  │           │     │chat state    │     │
│  └────────┘    └────────────┘  └───────────┘     └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
        │               │               │                  │
        ▼               ▼               ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS SERVER (Port 3000)                       │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                        API ROUTES (15 endpoints)                   │ │
│  │                                                                   │ │
│  │  GET    /api/projects                        → listProjects()     │ │
│  │  POST   /api/projects                        → createProject()    │ │
│  │  GET    /api/projects/[id]                   → getProject()       │ │
│  │  DELETE /api/projects/[id]                   → deleteProject()    │ │
│  │  POST   /api/projects/[id]/research           → researchAgent()   │ │
│  │  POST   /api/projects/[id]/stories            → storyAgent()      │ │
│  │  POST   /api/projects/[id]/wireframes         → wireframeAgent()  │ │
│  │  POST   /api/projects/[id]/wireframes/[wfId]/edit                  │ │
│  │           → wireframeEditorAgent(svg, command)                     │ │
│  │  POST   /api/projects/[id]/prd               → prdAgent()         │ │
│  │  POST   /api/projects/[id]/roadmap           → roadmapAgent()     │ │
│  │  POST   /api/projects/[id]/pipeline           → runFullPipeline() │ │
│  │  POST   /api/projects/[id]/pipeline/stream     → SSE stream       │ │
│  │           → runFullPipelineStream() (text/event-stream)           │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     AGENT LAYER (src/lib/agents/)                  │ │
│  │                                                                   │ │
│  │  researcher.ts      story-gen.ts       wireframe-gen.ts           │ │
│  │  prd-gen.ts         roadmap-gen.ts     wireframe-editor.ts        │ │
│  │  pipeline.ts (blocking)    pipeline-stream.ts (SSE streaming)     │ │
│  └───────────────────────────┬───────────────────────────────────────┘ │
│                              │                                          │
│  ┌───────────────────────────▼───────────────────────────────────────┐ │
│  │                    AI CLIENT (src/lib/ai.ts)                       │ │
│  │                                                                   │ │
│  │  Blocking:                                                        │ │
│  │    runAgent()          → generateText() → string                 │ │
│  │    runAgentStructured() → generateText() + JSON.parse → T         │ │
│  │                                                                   │ │
│  │  Streaming:                                                        │ │
│  │    streamAgent()       → streamText() → AsyncGenerator<token>    │ │
│  │    streamAgentStructured() → streamText() → { result: T }        │ │
│  │                                                                   │ │
│  │  Provider: @ai-sdk/openai-compatible                              │ │
│  │  Base URL: https://opencode.ai/zen/go/v1/chat/completions         │ │
│  │  Model:    deepseek-v4-pro                                        │ │
│  │  Auth:     Bearer OPENCODE_GO_API_KEY                             │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    DATA STORE (src/lib/store.ts)                   │ │
│  │                                                                   │ │
│  │  Type:     File-based JSON (data/*.json)                          │ │
│  │  Functions: listProjects, getProject, saveProject,               │ │
│  │            createProject, updateProject, deleteProject           │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    3D RENDERING (Three.js)                         │ │
│  │                                                                   │ │
│  │  neural-network.tsx       Obsidian-style node graph               │ │
│  │   · 120 nodes with glow halos                                     │ │
│  │   · 4 connections per node                                        │ │
│  │   · 30 animated pulse lines                                       │ │
│  │   · State-driven opacity/speed                                    │ │
│  │                                                                   │ │
│  │  neural-background.tsx    Wraps Canvas in root layout (global)    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

Blueprint follows a clean **multi-layer architecture**. The browser communicates with the server through 15 REST endpoints and one SSE stream. The API route layer validates inputs and delegates to the appropriate agent. Six specialized AI agents share a single client that abstracts the OpenCode Go provider. Results persist to a file-based JSON store that requires zero configuration.

The design principle is **dependency inversion**: routes know about agents, but agents don't know about HTTP. Agents know about the AI client, but the AI client doesn't know about any specific agent. The store can be swapped for any persistence backend without touching routes or agents.

A global Three.js canvas renders the neural network background across all pages. The graph's opacity and animation speed change based on agent state — idle (dim, slow), streaming (bright, fast pulsing), complete (brief flash), error (dimmed out).

---

## 2. Data Flow — SSE Streaming Pipeline

```
User types idea at /new
        │
        ▼
┌──────────────────┐
│ 1. POST /api/projects      │ Creates project with status "draft"
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. POST .../stream         │ SSE connection opens (text/event-stream)
│    Headers:                │ Single persistent HTTP connection
│    Content-Type:           │ No polling, no WebSocket handshake
│    text/event-stream       │
└────────┬─────────┘
         │
         ▼
   ┌─ SSE Events (streamed in order) ─────────────┐
   │                                                │
   │  data: {"type":"step_start","step":"research"} │
   │  data: {"type":"token","step":"research",     │
   │         "text":"ok, let me analyze..."}       │
   │  data: {"type":"token","step":"research",     │
   │         "text":"the market for..."}            │
   │  ...continuous token streaming...              │
   │  data: {"type":"step_end","step":"research"}   │
   │                                                │
   │  data: {"type":"step_start","step":"stories"}  │
   │  data: {"type":"token", ...}                   │
   │  data: {"type":"step_end","step":"stories"}    │
   │                                                │
   │  data: {"type":"step_start_spinner",           │
   │         "step":"wireframes"}                   │ ← No tokens
   │  data: {"type":"step_end_spinner",             │
   │         "step":"wireframes"}                   │
   │                                                │
   │  data: {"type":"step_start","step":"prd"}      │
   │  ...tokens...                                   │
   │  data: {"type":"done","projectId":"..."}       │
   └────────────────────────────────────────────────┘
         │
         ▼
    Client: router.push(/projects/[id])
```

### Why Sequential?

Each agent depends on prior output. The Story Generator needs the research summary. The Wireframe Generator needs finalized stories. The PRD Agent needs research, stories, and wireframes. Attempting parallelism would produce lower-quality output.

### SSE Event Types

| Event | Purpose | Token Stream? |
|-------|---------|:---:|
| `step_start` | Begins a streaming step (header in terminal) | Yes |
| `token` | Individual text chunk from the LLM | Yes |
| `step_end` | Streaming step complete, JSON parsed | — |
| `step_start_spinner` | Begins a non-streaming step (wireframes) | No |
| `step_end_spinner` | Non-streaming step complete | No |
| `error` | Step failed with message | — |
| `done` | All 5 agents succeeded | — |

### Why Wireframes Don't Stream Tokens

SVG markup tokens ("<rect x=", "50\" y=", etc.) are meaningless to a human observer. Streaming them creates visual noise without providing useful feedback. The wireframe generation step shows a spinner instead, and the full SVG appears on completion.

---

## 3. Agent Design

### Pattern

```typescript
// System prompt defines role, output format, and natural thinking instructions
const PROMPT = `You are an expert X. Think step-by-step out loud naturally,
then output JSON in a code block.`;

// Agent function
export async function xAgent(input): Promise<Output> {
  return runAgentStructured<Output>({ systemPrompt: PROMPT, userPrompt: input });
}
```

### Agent Inventory

| Agent | File | Input | Output | Stream? | ~Time |
|-------|------|-------|--------|:---:|:---:|
| **Researcher** | `researcher.ts` | Product idea | TAM/SAM/SOM, competitors, personas, viability | Yes | ~60s |
| **Story Gen** | `story-gen.ts` | Idea + research summary | 10-15 stories, ACs, MoSCoW priorities | Yes | ~90s |
| **Wireframe** | `wireframe-gen.ts` | Top 8 stories | 3 SVG wireframes, max 8 elements each | No | ~70s |
| **Wireframe Editor** | `wireframe-editor.ts` | SVG + command | Updated SVG | No | ~15s |
| **PRD** | `prd-gen.ts` | Idea + research + stories + wireframes | Complete PRD with goals, risks, architecture | Yes | ~90s |
| **Roadmap** | `roadmap-gen.ts` | Stories | 3-4 phases with deliverables | Yes | ~60s |

### Natural Language Thinking

All streaming agents are prompted to **think out loud in natural language** before producing structured JSON. Example:

```
ok, let me analyze this fitness app idea...
the market for AI fitness is growing rapidly — post-pandemic health
awareness surging. TAM around $4.2B at 28% CAGR. Key competitors:
Freeletics (strong brand, no AI), Nike Training Club (ecosystem,
generic plans), Future.co ($149/mo, 1:1 coaching)...

viability score: 78/100. strong demand, weak moat, execution-heavy.

[then JSON output]
```

The thinking text streams as `token` events. The `runAgentStructured` function parses only the JSON from the final accumulated text, discarding the thinking preamble.

### Wireframe Optimization

- Only top 8 stories passed (by priority)
- Max 8 SVG elements per wireframe
- Only `rect`, `text`, `line`, `circle` allowed
- No gradients, filters, or complex paths
- Cuts generation from 4+ min to ~70s

---

## 4. 3D Neural Network

The background graph uses Three.js via `@react-three/fiber`. It's rendered as a **fixed full-screen canvas** in the root layout, always present but animated differently based on agent state.

### Specifications

| Property | Value |
|----------|-------|
| Node count | 120 |
| Connections/node | 4 (k-nearest neighbors with randomization) |
| Node core | White sphere, radius 0.055 |
| Node halo | Red translucent sphere, radius 0.14 |
| Connection lines | Red `#ef4444`, opacity 0.18 (idle) / 0.35 (streaming) |
| Pulse lines | 30 animated connections, white |
| Pulse speed | 0.25 (idle) / 0.7 (streaming) |
| Rotation speed | 0.07 (idle) / 0.3 (streaming) rad/s |
| Node opacity | 0.55 (idle) / 0.9 (streaming) |
| Halo opacity | 0.1 (idle) / 0.25 (streaming) |

### State-Driven Behavior

| State | Rotation | Node Glow | Pulse Speed | Connection Opacity |
|-------|:---:|:---:|:---:|:---:|
| `idle` | 0.07 | Dim | 0.25 | 0.18 |
| `streaming` | 0.3 | Bright | 0.7 | 0.35 |
| `complete` | 0.1 | Brief flash | 0.25 | 0.25 |
| `error` | 0.05 | Very dim | 0.15 | 0.08 |

---

## 5. Store Layer

```
Storage:      filesystem → data/*.json
Location:     process.cwd()/data/
One file per: data/{uuid}.json

CRUD API:
  listProjects()      → Project[]         (sorted by updatedAt desc)
  getProject(id)      → Project | null
  saveProject(p)      → void              (upsert, auto-sets updatedAt)
  createProject(i,n)  → Project           (generates UUID, saves)
  updateProject(i,u)  → Project           (partial update)
  deleteProject(id)   → boolean           (unlinks file)
```

Human-readable JSON files. Zero database setup. Portable across machines. Scales fine for single-user/small-team use.

---

## 6. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-02 | Next.js 16 App Router | Server components for data fetching |
| 2026-06-02 | File-based JSON store | Zero-setup persistence; projects are small files |
| 2026-06-02 | OpenCode Go ($10/mo) over OpenAI | Flat-rate, DeepSeek V4 Pro quality sufficient |
| 2026-06-02 | shadcn/ui base-nova | Clean defaults; Tailwind v4 support |
| 2026-06-02 | Sequential pipeline | Each agent depends on prior output |
| 2026-06-02 | Client-side Markdown export | Instant; no server processing |
| 2026-06-03 | SSE over WebSockets | Unidirectional; simpler; built into HTTP |
| 2026-06-03 | Wireframes excluded from token streaming | SVG tokens meaningless to users |
| 2026-06-03 | Natural language thinking prompts | More engaging UX than raw code headers |
| 2026-06-03 | Three.js obsidian node graph | Visual feedback of agent state |
| 2026-06-03 | System fonts over Google Fonts | Offline build reliability |
| 2026-06-03 | No auth (deferred) | Single-user MVP; add in Phase 3 |
| 2026-06-03 | Wireframe chat (NL edits) | Low-latency (15s avg), high user value |

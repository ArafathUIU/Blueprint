<p align="center">
  <h1 align="center">
    <span style="color: #DC2626;">blueprint</span>
  </h1>
  <p align="center">from idea to roadmap. in one workflow.</p>
</p>

---

# Blueprint — AI Product Manager Agent

An autonomous AI agent that takes a raw product idea and produces a complete product package: market research, user stories, wireframes, a PRD, and a development roadmap — all in one continuous SSE-streamed workflow.

---

## Table of Contents

- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Features Deep-Dive](#features-deep-dive)
- [Roadmap](#roadmap)

---

## Screenshots

### 1. Landing Page (`/`)
macOS-style terminal typewriter showing the agent's internal monologue. Neural network 3D background. Headline + CTA fade in while the terminal is still typing.

<p align="center">
  <img src="https://raw.githubusercontent.com/ArafathUIU/Blueprint/main/public/screenshots/landing.png" alt="Landing page with terminal typewriter" width="800" />
</p>

### 2. Idea Input (`/new`)
Dark form with live SSE-streamed pipeline progress. Terminal-style output panel shows agent thinking in natural language. Step indicators update in real-time.

<p align="center">
  <img src="https://raw.githubusercontent.com/ArafathUIU/Blueprint/main/public/screenshots/new-idea.png" alt="Idea input page with form" width="800" />
</p>

### 3. Projects List (`/projects`)
Grid of all blueprints with status badges, artifact completion dots, and inline delete buttons.

<p align="center">
  <img src="https://raw.githubusercontent.com/ArafathUIU/Blueprint/main/public/screenshots/projects-list.png" alt="Projects list with status badges" width="800" />
</p>

### 4. Project View (`/projects/[id]`)
Colorful solid-card design with colored accent sections. Export + Delete buttons. Wireframe Chat for natural language edits.

<p align="center">
  <img src="https://raw.githubusercontent.com/ArafathUIU/Blueprint/main/public/screenshots/project-view.png" alt="Project view with research, stories, wireframes, PRD, and roadmap" width="800" />
</p>

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          BROWSER (Client)                             │
│                                                                      │
│  ┌─────────┐   ┌─────────┐   ┌──────────┐   ┌───────────────────┐  │
│  │ /       │   │ /new    │   │ /projects │   │ /projects/[id]    │  │
│  │ Terminal│   │ SSE     │   │ List View │   │ Project + Chat    │  │
│  │ Hero    │   │ Stream  │   │ + Delete  │   │ + Export + Edit   │  │
│  └────┬────┘   └────┬────┘   └────┬─────┘   └────────┬──────────┘  │
│       │             │             │                   │              │
└───────┼─────────────┼─────────────┼───────────────────┼──────────────┘
        │             │             │                   │
        ▼             ▼             ▼                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       NEXT.JS SERVER (Port 3000)                      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    15 API ROUTES (ƒ dynamic)                    │ │
│  │                                                                │ │
│  │  GET/POST   /api/projects                                       │ │
│  │  GET/DELETE /api/projects/[id]                                  │ │
│  │  POST  /api/projects/[id]/research /stories /wireframes        │ │
│  │  POST  /api/projects/[id]/prd /roadmap                          │ │
│  │  POST  /api/projects/[id]/pipeline        (blocking)            │ │
│  │  POST  /api/projects/[id]/pipeline/stream (SSE, text/event-stream)│
│  │  POST  /api/projects/[id]/wireframes/[wfId]/edit                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     AGENT LAYER (src/lib/agents/)               │ │
│  │                                                                │ │
│  │  researcher.ts      story-gen.ts       wireframe-gen.ts        │ │
│  │  prd-gen.ts         roadmap-gen.ts     wireframe-editor.ts     │ │
│  │  pipeline.ts (blocking)  pipeline-stream.ts (SSE streaming)    │ │
│  └────────────────────────────┬───────────────────────────────────┘ │
│                               │                                      │
│  ┌────────────────────────────▼───────────────────────────────────┐ │
│  │                    AI CLIENT (src/lib/ai.ts)                    │ │
│  │                                                                │ │
│  │  runAgent() → blocking              streamAgent() → streaming  │ │
│  │  runAgentStructured() → JSON parse   streamAgentStructured()    │ │
│  │                                                                │ │
│  │  Provider:  @ai-sdk/openai-compatible                          │ │
│  │  Base URL:  https://opencode.ai/zen/go/v1/chat/completions     │ │
│  │  Model:     deepseek-v4-pro                                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    DATA STORE (src/lib/store.ts)                │ │
│  │                                                                │ │
│  │  File-based JSON · data/{uuid}.json                            │ │
│  │  CRUD + deleteProject()                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Pipeline Flow (Streaming)

```
User types idea at /new
        │
        ▼
┌──────────────────┐
│ 1. POST /api/projects     │  Create project (draft)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. POST .../stream        │  SSE connection opened
│    (text/event-stream)    │  Single persistent connection
└────────┬─────────┘
         │
         ▼
   ┌─ SSE Events ──────────────────────────────┐
   │                                            │
   │  step_start: "research"                   │
   │  token: "ok, let me analyze..."           │
   │  token: "the market for fitness..."       │
   │  ...continuous streaming...               │
   │  step_end: "research"                     │
   │                                            │
   │  step_start: "stories"                    │
   │  token: "structuring user stories..."     │
   │  ...                                      │
   │  step_end: "stories"                      │
   │                                            │
   │  step_start_spinner: "wireframes"         │  ← No token streaming
   │  step_end_spinner: "wireframes"           │     (SVG tokens meaningless)
   │                                            │
   │  step_start: "prd"                        │
   │  token: "assembling the PRD..."           │
   │  ...                                      │
   │  done: { projectId: "..." }               │
   └────────────────────────────────────────────┘
         │
         ▼
    Redirect to /projects/[id]
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **3D Graphics** | Three.js + @react-three/fiber |
| **AI SDK** | Vercel AI SDK + `@ai-sdk/openai-compatible` |
| **LLM** | DeepSeek V4 Pro via OpenCode Go ($10/mo) |
| **Streaming** | SSE (Server-Sent Events) + `streamText()` |
| **Icons** | lucide-react |
| **Storage** | File-based JSON store (`data/*.json`) |
| **Fonts** | System font stack (Sans + Mono) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenCode Go API key ([subscribe here](https://opencode.ai/go) — $10/mo)

### Setup

```bash
git clone https://github.com/ArafathUIU/Blueprint.git
cd Blueprint
npm install
cp .env.example .env.local
# Edit .env.local:  OPENCODE_GO_API_KEY=sk-...
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# Production build
npm run build && npm start
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create project `{ idea, name }` |
| `GET` | `/api/projects/:id` | Get project |
| `DELETE` | `/api/projects/:id` | Delete project |
| `POST` | `/api/projects/:id/research` | Run research agent |
| `POST` | `/api/projects/:id/stories` | Generate user stories |
| `POST` | `/api/projects/:id/wireframes` | Generate wireframes |
| `POST` | `/api/projects/:id/wireframes/:wfId/edit` | Edit wireframe `{ command }` |
| `POST` | `/api/projects/:id/prd` | Assemble PRD |
| `POST` | `/api/projects/:id/roadmap` | Generate roadmap |
| `POST` | `/api/projects/:id/pipeline` | Run all 5 agents (blocking) |
| `POST` | `/api/projects/:id/pipeline/stream` | Run pipeline via SSE |

```bash
# Quick start
curl -X POST localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"idea": "AI fitness coach app"}'

curl -X POST localhost:3000/api/projects/PROJECT_ID/pipeline/stream

# Edit wireframe
curl -X POST localhost:3000/api/projects/PROJECT_ID/wireframes/WF-001/edit \
  -H "Content-Type: application/json" \
  -d '{"command": "make the CTA button red and centered"}'
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                   # Root layout, nav, neural bg
│   ├── page.tsx                     # Terminal typewriter landing
│   ├── globals.css                  # Theme + shadcn base
│   ├── new/
│   │   └── page.tsx                 # Idea input + SSE live stream
│   ├── projects/
│   │   ├── page.tsx                 # All projects list (+ delete)
│   │   └── [id]/
│   │       └── page.tsx             # Project view (colorful cards)
│   └── api/projects/
│       ├── route.ts                 # GET list, POST create
│       └── [id]/
│           ├── route.ts             # GET, DELETE
│           ├── research/route.ts
│           ├── stories/route.ts
│           ├── wireframes/route.ts
│           ├── wireframes/[wfId]/edit/route.ts
│           ├── prd/route.ts
│           ├── roadmap/route.ts
│           ├── pipeline/route.ts
│           └── pipeline/stream/route.ts  # SSE endpoint
├── components/
│   ├── ui/                          # shadcn/ui primitives
│   ├── neural-network.tsx           # Obsidian node graph (Three.js)
│   ├── neural-network-canvas.tsx    # Canvas wrapper
│   ├── neural-background.tsx        # Global bg component
│   ├── terminal-typewriter.tsx      # macOS terminal animation
│   ├── live-stream-panel.tsx        # Agent output terminal
│   ├── export-buttons.tsx           # Copy/Download/Print
│   ├── delete-button.tsx            # Confirm-delete UI
│   ├── wireframe-chat.tsx           # Chat input for wireframe edits
│   └── wireframe-with-chat.tsx      # Wireframe card + chat
├── lib/
│   ├── ai.ts                        # OpenCode Go client (+ streaming)
│   ├── types.ts                     # Data model (Project, MarketResearch, ...)
│   ├── store.ts                     # File-based CRUD + delete
│   └── agents/
│       ├── researcher.ts            # Market research agent
│       ├── story-gen.ts             # User story generator
│       ├── wireframe-gen.ts         # SVG wireframe generator
│       ├── wireframe-editor.ts      # Wireframe chat editor
│       ├── prd-gen.ts              # PRD assembler
│       ├── roadmap-gen.ts          # Roadmap generator
│       ├── pipeline.ts             # Blocking orchestrator
│       └── pipeline-stream.ts      # SSE streaming orchestrator
└── public/
    ├── icon.svg                     # LEGO brick favicon
    ├── logo-horizontal.svg
    ├── logo-vertical.svg
    └── logo-dark.svg
```

---

## Features Deep-Dive

### SSE Streaming Pipeline
The pipeline streams agent output in real-time via Server-Sent Events. Tokens from the LLM are pushed to the browser as they're generated — users see the agent "thinking out loud" in natural language, exactly like a human PM would analyze a product idea.

### Neural Network Background
An Obsidian-style 3D node graph rendered with Three.js. ~120 nodes with glow halos, visible connections, and animated white pulses traveling along edges. Graph brightness and pulse speed increase during agent activity.

### Natural Language Agent Thinking
Prompt engineering instructs the LLM to think step-by-step out loud before producing structured JSON. The thinking text streams live, while JSON is parsed at the end of each step. Wireframe generation uses a spinner (SVG tokens are meaningless to stream).

### Wireframe Chat
Edit generated wireframes with natural language commands. Type "make the CTA bigger", "add a search bar", "center the login form" — the agent regenerates the SVG inline. Chat history tracks all edits.

### Project Management
- **List**: All projects with status badges and artifact completion dots
- **View**: Colorful solid-card sections with colored accents per artifact type
- **Export**: Copy Markdown, download `.md`, or Print/Save as PDF
- **Delete**: Two-step confirm before permanent deletion

---

## Roadmap

### ✅ Phase 0 — Setup
- [x] Next.js + Tailwind + shadcn/ui
- [x] LEGO brick logo
- [x] Red/black/white theme

### ✅ Phase 1 — Core
- [x] OpenCode Go integration (blocking + streaming)
- [x] 5 AI agents (Research, Stories, Wireframes, PRD, Roadmap)
- [x] File-based JSON store with CRUD + delete
- [x] SSE streaming pipeline
- [x] Terminal typewriter landing page
- [x] Idea input with live progress
- [x] Colorful project view
- [x] Projects list page
- [x] Export (Markdown, Print/PDF)

### ✅ Phase 2 — Enhancements
- [x] 3D neural network background (Obsidian-style)
- [x] Natural language agent thinking in terminal
- [x] Wireframe chat (NL editing)
- [x] Project delete

### TODO — Phase 3
- [ ] Jira/Linear/GitHub roadmap export
- [ ] Multi-format PRD export (Notion, Google Docs)
- [ ] User feedback ingestion
- [ ] Competitor monitoring alerts
- [ ] Stakeholder sharing (read-only links)

### TODO — Phase 4
- [ ] Template marketplace
- [ ] Team collaboration
- [ ] Analytics dashboard

---

## Built by

**Md. Arafath Hossain Akash** · [github.com/ArafathUIU](https://github.com/ArafathUIU)

---

MIT License

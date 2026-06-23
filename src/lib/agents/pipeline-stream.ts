import type { Project } from "../types";
import { streamAgent } from "../ai";
import { wireframeAgent } from "./wireframe-gen";
import { updateProject } from "../store";

// System prompts — encourage thinking out loud before structured output
const RESEARCH_PROMPT = `You are an expert market research analyst. Think step-by-step out loud as you analyze the product idea naturally, like you're talking to yourself while working. Show your reasoning about the market, competitors, personas, and viability. After your analysis, output the final result as JSON in a code block.

Example thinking style:
"ok, let me analyze this... the market for AI fitness apps has been growing rapidly since 2024. TAM is probably around $4-5B given the global wellness market. for SAM i need to narrow to mobile-first AI fitness specifically... that's likely $700-900M. this is a strong category but execution-heavy."

JSON format (output after your thinking):
\`\`\`json
{
  "tam": "Total Addressable Market estimate with source",
  "sam": "Serviceable Addressable Market estimate",
  "som": "Serviceable Obtainable Market estimate (Year 1 target)",
  "trends": ["Key market trend 1", "Key market trend 2", "Key market trend 3"],
  "competitors": [
    { "name": "Competitor name", "strength": "Their main strength", "weakness": "Their main weakness", "differentiation": "How we differentiate against them" }
  ],
  "personas": [
    { "name": "Persona name/role", "painPoint": "Their main pain point", "willingnessToPay": "High/Medium/Low with price range" }
  ],
  "viabilityScore": 0-100,
  "summary": "2-3 sentence executive summary of findings",
  "sources": [
    { "title": "Source title (e.g. Grand View Research - Digital Health Market 2025)", "url": "https://example.com/report" }
  ]
}
\`\`\`

Provide realistic, well-researched estimates. Include 4-6 real competitors and 3-4 personas. Be specific with numbers. Base on actual market data. Include 3-5 credible sources with URLs for your data points.`;

const STORIES_PROMPT = `You are an expert product manager writing agile user stories. Think out loud as you analyze personas, define epics, and draft each story. Show your reasoning process naturally. After your thinking, output the stories as a JSON array in a code block.

Example thinking:
"alright, based on the research, my personas are: fitness beginner (wants guidance), gym regular (wants optimization), personal trainer (wants client tools). let me structure epics... onboard & profile is a Must epic since users need biometric input first. core workout engine is the product's heart — P0. progress tracking is P1 since it drives retention..."

JSON format:
\`\`\`json
[{ "id": "US-001", "epic": "Epic name", "story": "As a [persona], I want [feature] so that [benefit]", "acceptanceCriteria": ["AC 1", "AC 2"], "priority": "P0|P1|P2", "moscow": "Must|Should|Could|Wont" }]
\`\`\`

Create 10-15 stories across 3-5 epics. At least 3 P0/Must. Map to real personas from the research.`;

const PRD_PROMPT = `You are an expert technical product manager writing a PRD. Think out loud as you review all inputs (idea, research, stories, wireframes), define the problem, set goals, identify risks, and structure the document. Show your natural reasoning. Then output the PRD as JSON in a code block.

JSON format:
\`\`\`json
{ "problemStatement": "...", "goals": [{"goal":"...", "metric":"...", "target":"..."}], "targetUsers": ["..."], "keyFeatures": [{"feature":"...", "description":"...", "priority":"P0|P1|P2"}], "technicalArchitecture": "...", "successMetrics": [{"metric":"...", "baseline":"...", "target":"..."}], "risks": [{"risk":"...", "likelihood":"Low|Medium|High", "impact":"Low|Medium|High", "mitigation":"..."}], "dependencies": ["..."], "sources": [{"title":"...", "url":"https://..."}] }
\`\`\`

Base everything on the provided context. Be specific and data-driven. Include 3-5 credible sources with URLs for technical references, market data, or architectural decisions.`;

const ROADMAP_PROMPT = `You are an expert technical project manager building a roadmap. Think out loud as you review the prioritized stories, define phases, estimate effort, and assign stories to each phase. Show your planning reasoning naturally. Then output the roadmap as a JSON array in a code block.

JSON format:
\`\`\`json
[{ "phase": "Phase name", "timeline": "Weeks X-Y", "deliverables": ["..."], "stories": ["US-XXX"] }]
\`\`\`

Phase 1 must be MVP with P0/Must stories only. Create 3-4 phases with 3-5 deliverables each. All stories must be assigned. Timeline should be realistic (4-6 weeks per phase).`;

// SSE event types
export interface SseStepStart {
  type: "step_start";
  step: string;
}

export interface SseToken {
  type: "token";
  step: string;
  text: string;
}

export interface SseStepEnd {
  type: "step_end";
  step: string;
  result: unknown;
  thinkingText: string;
}

export interface SseStepStartSpinner {
  type: "step_start_spinner";
  step: string;
}

export interface SseStepEndSpinner {
  type: "step_end_spinner";
  step: string;
  result: unknown;
}

export interface SseError {
  type: "error";
  step: string;
  message: string;
}

export interface SseDone {
  type: "done";
  projectId: string;
}

export type SseEvent =
  | SseStepStart
  | SseToken
  | SseStepEnd
  | SseStepStartSpinner
  | SseStepEndSpinner
  | SseError
  | SseDone;

function parseJson<T>(text: string, label: string): { result: T; thinkingText: string } {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  const thinkingText = jsonMatch ? text.slice(0, text.indexOf("```")).trim() : "";
  try {
    return { result: JSON.parse(jsonStr) as T, thinkingText };
  } catch {
    const bracketMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (bracketMatch) {
      return { result: JSON.parse(bracketMatch[0]) as T, thinkingText: text.slice(0, text.indexOf(bracketMatch[0])).trim() };
    }
    throw new Error(`Failed to parse ${label} as JSON. Response: ${text.slice(0, 300)}`);
  }
}

async function* streamStep(
  step: string,
  systemPrompt: string,
  userPrompt: string,
  project: Project,
  persistFn: (project: Project, result: unknown, thinkingText: string) => void
): AsyncGenerator<SseEvent> {
  yield { type: "step_start", step };

  let fullText = "";
  try {
    for await (const event of streamAgent({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
    })) {
      if (event.type === "token") {
        fullText += event.text;
        yield { type: "token", step, text: event.text };
      }
    }

    const { result, thinkingText } = parseJson(fullText, step);
    persistFn(project, result, thinkingText);
    yield { type: "step_end", step, result, thinkingText };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    updateProject(project.id, { status: "error", error: msg });
    yield { type: "error", step, message: msg };
    throw e;
  }
}

export async function* runFullPipelineStream(
  project: Project
): AsyncGenerator<SseEvent> {
  let current = { ...project };
  const rawAnalysis: Record<string, string> = {};

  // --- Step 1: Research (streams tokens) ---
  yield* streamStep(
    "research",
    RESEARCH_PROMPT,
    `Product Idea: ${current.idea}`,
    current,
    (p, result, thinkingText) => {
      rawAnalysis.research = thinkingText;
      current = updateProject(p.id, { research: result as Project["research"], rawAnalysis, status: "researching" });
    }
  );

  // --- Step 2: Stories (streams tokens) ---
  yield* streamStep(
    "stories",
    STORIES_PROMPT,
    `Product Idea: ${current.idea}\n\nMarket Research Summary: ${current.research?.summary || "N/A"}`,
    current,
    (p, result, thinkingText) => {
      rawAnalysis.stories = thinkingText;
      current = updateProject(p.id, { stories: result as Project["stories"], rawAnalysis, status: "generating_stories" });
    }
  );

  // --- Step 3: Wireframes (no streaming) ---
  yield { type: "step_start_spinner", step: "wireframes" };
  try {
    const wireframes = await wireframeAgent(current.stories!);
    current = updateProject(current.id, { wireframes, status: "generating_wireframes" });
    yield { type: "step_end_spinner", step: "wireframes", result: wireframes };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    updateProject(current.id, { status: "error", error: msg });
    yield { type: "error", step: "wireframes", message: msg };
    return;
  }

  // --- Step 4: PRD (streams tokens) ---
  yield* streamStep(
    "prd",
    PRD_PROMPT,
    `Product Idea: ${current.idea}\n\nStories: ${current.stories?.length || 0}\nWireframes: ${current.wireframes?.map((w: any) => w.title).join(", ") || "N/A"}\nMarket: ${current.research?.summary || "N/A"}`,
    current,
    (p, result, thinkingText) => {
      rawAnalysis.prd = thinkingText;
      current = updateProject(p.id, { prd: result as Project["prd"], rawAnalysis, status: "generating_prd" });
    }
  );

  // --- Step 5: Roadmap (streams tokens) ---
  yield* streamStep(
    "roadmap",
    ROADMAP_PROMPT,
    `User Stories:\n${current.stories?.map((s) => `[${s.id}][${s.priority}][${s.moscow}] ${s.epic}: ${s.story}`).join("\n") || "N/A"}`,
    current,
    (p, result, thinkingText) => {
      rawAnalysis.roadmap = thinkingText;
      current = updateProject(p.id, { roadmap: result as Project["roadmap"], rawAnalysis, status: "complete" });
    }
  );

  yield { type: "done", projectId: current.id };
}

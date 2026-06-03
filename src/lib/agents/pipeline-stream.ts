import type { Project } from "../types";
import { streamAgent } from "../ai";
import { wireframeAgent } from "./wireframe-gen";
import { updateProject } from "../store";

// System prompts — same as the individual agents
const RESEARCH_PROMPT = `You are an expert market research analyst. Given a product idea, you must produce a comprehensive market research report. Output ONLY valid JSON matching this schema:

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
  "summary": "2-3 sentence executive summary of findings"
}

Provide realistic, well-researched estimates. Include 4-6 competitors and 3-4 personas. Be specific with numbers.`;

const STORIES_PROMPT = `You are an expert product manager specializing in agile user story creation. Given a product idea and its market research, generate 10-15 user stories with acceptance criteria. Output ONLY valid JSON array of: { id, epic, story, acceptanceCriteria, priority, moscow }. Priority: P0|P1|P2. Moscow: Must|Should|Could|Wont. Map stories to personas from research.`;

const PRD_PROMPT = `You are an expert technical product manager who writes professional Product Requirements Documents. Given a product idea, market research, user stories, and wireframes, assemble a complete PRD. Output ONLY valid JSON: { problemStatement, goals: [{goal, metric, target}], targetUsers, keyFeatures: [{feature, description, priority}], technicalArchitecture, successMetrics: [{metric, baseline, target}], risks: [{risk, likelihood, impact, mitigation}], dependencies }. Base everything on the provided context. Be specific and data-driven.`;

const ROADMAP_PROMPT = `You are an expert technical project manager who creates development roadmaps. Given prioritized user stories, generate a phased development plan. Output ONLY valid JSON array of: { phase, timeline, deliverables, stories }. Phase 1 must be MVP with P0/Must stories only. Create 3-4 phases with 3-5 deliverables each. All stories must be assigned to a phase. Timeline should be realistic (4-6 weeks per phase).`;

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
}

export interface SseStepStartSpinner {
  type: "step_start_spinner";
  step: string;
}

export interface SseStepEndSpinner {
  type: "step_end_spinner";
  step: string;
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

function parseJson<T>(text: string, label: string): T {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    const bracketMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (bracketMatch) {
      return JSON.parse(bracketMatch[0]) as T;
    }
    throw new Error(`Failed to parse ${label} as JSON. Response: ${text.slice(0, 300)}`);
  }
}

async function* streamStep(
  step: string,
  systemPrompt: string,
  userPrompt: string,
  project: Project,
  persistFn: (project: Project, result: unknown) => void
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

    const result = parseJson(fullText, step);
    persistFn(project, result);
    yield { type: "step_end", step };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    updateProject(project.id, { status: "error", error: msg });
    yield { type: "error", step, message: msg };
    throw e; // stop pipeline
  }
}

export async function* runFullPipelineStream(
  project: Project
): AsyncGenerator<SseEvent> {
  let current = { ...project };

  // --- Step 1: Research (streams tokens) ---
  yield* streamStep(
    "research",
    RESEARCH_PROMPT,
    `Product Idea: ${current.idea}`,
    current,
    (p, result) => {
      current = updateProject(p.id, {
        research: result as Project["research"],
        status: "researching",
      });
    }
  );

  // --- Step 2: Stories (streams tokens) ---
  yield* streamStep(
    "stories",
    STORIES_PROMPT,
    `Product Idea: ${current.idea}\n\nMarket Research Summary: ${current.research?.summary || "N/A"}`,
    current,
    (p, result) => {
      current = updateProject(p.id, {
        stories: result as Project["stories"],
        status: "generating_stories",
      });
    }
  );

  // --- Step 3: Wireframes (no streaming — spinner only) ---
  yield { type: "step_start_spinner", step: "wireframes" };
  try {
    const wireframes = await wireframeAgent(current.stories!);
    current = updateProject(current.id, {
      wireframes,
      status: "generating_wireframes",
    });
    yield { type: "step_end_spinner", step: "wireframes" };
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
    `Product Idea: ${current.idea}\n\nStories Count: ${current.stories?.length || 0}\nWireframes: ${current.wireframes?.map((w) => w.title).join(", ") || "N/A"}\nMarket Summary: ${current.research?.summary || "N/A"}`,
    current,
    (p, result) => {
      current = updateProject(p.id, {
        prd: result as Project["prd"],
        status: "generating_prd",
      });
    }
  );

  // --- Step 5: Roadmap (streams tokens) ---
  yield* streamStep(
    "roadmap",
    ROADMAP_PROMPT,
    `User Stories:\n${current.stories?.map((s) => `[${s.id}][${s.priority}][${s.moscow}] ${s.epic}: ${s.story}`).join("\n") || "N/A"}`,
    current,
    (p, result) => {
      current = updateProject(p.id, {
        roadmap: result as Project["roadmap"],
        status: "complete",
      });
    }
  );

  yield { type: "done", projectId: current.id };
}

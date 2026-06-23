import type { Project } from "../types";
import { streamAgent } from "../ai";
import { wireframeAgent } from "./wireframe-gen";
import { updateProject } from "../store";

// System prompts — use <thought> for reasoning, <result> for structured JSON output
const RESEARCH_PROMPT = `You are an expert market research analyst. Before doing ANY task, emit your reasoning process using this exact format:

<thought>your internal reasoning here — analyze the product idea, market sizing logic, competitor landscape, persona analysis, viability assessment. Be verbose. Show your actual reasoning process.</thought>

Then emit the final result:
<result>{ your JSON here }</result>

The <result> must be valid JSON matching this schema:
{
  "tam": "Total Addressable Market estimate with source and year",
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
    { "title": "Source title with publication and year", "url": "https://example.com/report" }
  ]
}

Provide realistic, well-researched estimates. Include 4-6 real competitors and 3-4 personas. Be specific with numbers. Include 3-5 credible sources with URLs.`;

const STORIES_PROMPT = `You are an expert product manager writing agile user stories. Before doing ANY task, emit your reasoning process using this exact format:

<thought>your internal reasoning here — analyze the personas from the research, define epics and themes, prioritize by MoSCoW, draft each story, think about dependencies and coverage. Show your actual reasoning.</thought>

Then emit the final result:
<result>[ { "id": "US-001", "epic": "Epic name", "story": "As a [persona], I want [feature] so that [benefit]", "acceptanceCriteria": ["AC 1", "AC 2"], "priority": "P0|P1|P2", "moscow": "Must|Should|Could|Wont" } ]</result>

The <result> must be a valid JSON array. Create 10-15 stories across 3-5 epics. At least 3 P0/Must. Map to real personas from the research. Be specific in acceptance criteria.`;

const PRD_PROMPT = `You are an expert technical product manager writing a PRD. Before doing ANY task, emit your reasoning process using this exact format:

<thought>your internal reasoning here — review the product idea, research findings, user stories, and wireframes. Define the problem, set measurable goals, identify key features, propose technical architecture, define success metrics, assess risks, and note dependencies. Show your actual reasoning.</thought>

Then emit the final result:
<result>{ "problemStatement": "...", "goals": [{"goal":"...", "metric":"...", "target":"..."}], "targetUsers": ["..."], "keyFeatures": [{"feature":"...", "description":"...", "priority":"P0|P1|P2"}], "technicalArchitecture": "...", "successMetrics": [{"metric":"...", "baseline":"...", "target":"..."}], "risks": [{"risk":"...", "likelihood":"Low|Medium|High", "impact":"Low|Medium|High", "mitigation":"..."}], "dependencies": ["..."], "sources": [{"title":"...", "url":"https://..."}] }</result>

The <result> must be valid JSON. Base everything on the provided context. Be specific and data-driven. Include 3-5 credible sources with URLs.`;

const ROADMAP_PROMPT = `You are an expert technical project manager building a roadmap. Before doing ANY task, emit your reasoning process using this exact format:

<thought>your internal reasoning here — review the prioritized user stories, define development phases, estimate effort and timelines, assign stories to each phase, think about dependencies between phases. Show your actual planning reasoning.</thought>

Then emit the final result:
<result>[ { "phase": "Phase name", "timeline": "Weeks X-Y", "deliverables": ["..."], "stories": ["US-XXX"] } ]</result>

The <result> must be a valid JSON array. Phase 1 must be MVP with P0/Must stories only. Create 3-4 phases with 3-5 deliverables each. All stories must be assigned. Timeline should be realistic (4-6 weeks per phase).`;

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
  const resultMatch = text.match(/<result>\s*([\s\S]*?)\s*<\/result>/);
  const thoughtMatch = text.match(/<thought>\s*([\s\S]*?)\s*<\/thought>/);

  let jsonStr: string;
  let thinkingText: string;

  if (resultMatch) {
    jsonStr = resultMatch[1].trim();
    thinkingText = thoughtMatch ? thoughtMatch[1].trim() : "";
  } else {
    // Fallback: try ```json code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
    thinkingText = jsonMatch ? text.slice(0, text.indexOf("```")).trim() : "";
  }

  try {
    return { result: JSON.parse(jsonStr) as T, thinkingText };
  } catch {
    const bracketMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (bracketMatch) {
      return { result: JSON.parse(bracketMatch[0]) as T, thinkingText: "" };
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

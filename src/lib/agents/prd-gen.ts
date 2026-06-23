import { runAgentStructured } from "../ai";
import type { PRD, MarketResearch, UserStory, Wireframe } from "../types";

const SYSTEM_PROMPT = `You are an expert technical product manager who writes professional Product Requirements Documents. Given all prior research, stories, and wireframes, assemble a complete PRD. Output ONLY valid JSON:

{
  "problemStatement": "1-2 paragraphs describing the problem being solved",
  "goals": [
    {
      "goal": "Goal description",
      "metric": "How to measure it",
      "target": "Target value"
    }
  ],
  "targetUsers": ["User type 1 description", "User type 2 description"],
  "keyFeatures": [
    {
      "feature": "Feature name",
      "description": "What it does",
      "priority": "P0/P1/P2"
    }
  ],
  "technicalArchitecture": "High-level architecture description (tech stack, data flow, components)",
  "successMetrics": [
    {
      "metric": "Metric name",
      "baseline": "Current state",
      "target": "Target value after launch"
    }
  ],
  "risks": [
    {
      "risk": "Risk description",
      "likelihood": "Low/Medium/High",
      "impact": "Low/Medium/High",
      "mitigation": "How to mitigate"
    }
  ],
  "dependencies": ["Dependency 1", "Dependency 2"],
  "sources": [
    { "title": "Source title", "url": "https://example.com/source" }
  ]
}

Rules:
- Base everything on the provided research and stories
- Include 4-6 goals, 5-8 features, 4-6 success metrics, 4-6 risks
- Architecture should be realistic and modern
- Be specific and data-driven
- Include 3-5 credible sources with URLs for technical references`;

export async function prdAgent(
  idea: string,
  research: MarketResearch,
  stories: UserStory[],
  wireframes: Wireframe[]
): Promise<PRD> {
  const context = [
    `Product Idea: ${idea}`,
    `Market Summary: ${research.summary}`,
    `Personas: ${research.personas.map((p) => p.name).join(", ")}`,
    `Total Stories: ${stories.length}`,
    `Priority Distribution: P0=${stories.filter((s) => s.priority === "P0").length}, P1=${stories.filter((s) => s.priority === "P1").length}, P2=${stories.filter((s) => s.priority === "P2").length}`,
    `Wireframes: ${wireframes.map((w) => w.title).join(", ")}`,
  ].join("\n");

  return runAgentStructured<PRD>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: context,
    schema: "PRD",
  });
}

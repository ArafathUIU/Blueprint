import { runAgentStructured } from "../ai";
import type { Wireframe, UserStory } from "../types";

const SYSTEM_PROMPT = `You are an expert UX designer who creates wireframe specifications. Given user stories, generate low-fidelity wireframe specifications. Output ONLY valid JSON:

Array of:
{
  "id": "WF-XXX",
  "title": "Screen name",
  "description": "What this screen does and shows",
  "svg": "A valid SVG string representing a simple wireframe mockup. Use a 400x300 viewBox, white background with a light gray #f4f4f5 border. Use gray rectangles for UI elements, black text for labels, red #DC2626 for primary CTAs. Keep it clean, modern, and readable.",
  "annotations": ["Annotation 1 about a UI element", "Annotation 2"],
  "linkedStories": ["US-XXX", "US-YYY"]
}

Rules:
- Create 3-5 wireframes
- Each wireframe should map to relevant user stories
- SVGs must be functional - use simple shapes (rectangles, text, lines)
- Include a main dashboard/home screen, a key feature screen, and a results/output screen
- Annotations should explain UI decisions linked to user needs
- Use a clean, professional wireframe style`;

export async function wireframeAgent(stories: UserStory[]): Promise<Wireframe[]> {
  const storySummary = stories
    .map((s) => `[${s.id}] ${s.story}`)
    .join("\n");

  return runAgentStructured<Wireframe[]>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `User Stories:\n${storySummary}`,
    schema: "Wireframe[]",
  });
}

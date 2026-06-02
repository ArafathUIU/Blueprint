import { runAgentStructured } from "../ai";
import type { Wireframe, UserStory } from "../types";

const SYSTEM_PROMPT = `You are an expert UX designer creating wireframe specifications. Given user stories, generate low-fidelity wireframe specs. Output ONLY valid JSON:

Array of:
{
  "id": "WF-XXX",
  "title": "Screen name",
  "description": "Brief 1-sentence screen purpose",
  "svg": "<svg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'><rect width='400' height='300' fill='#fff'/><rect x='10' y='10' width='380' height='30' rx='6' fill='#f4f4f5' stroke='#e4e4e7'/><text x='20' y='30' font-family='sans-serif' font-size='13' fill='#18181b'>[Page Title]</text><!-- add 3-5 simple UI blocks --></svg>",
  "annotations": ["Short annotation"],
  "linkedStories": ["US-XXX"]
}

SVG Rules (CRITICAL for speed - keep it minimal):
- viewBox 0 0 400 300
- White #fff background rect
- Use ONLY simple gray #f4f4f5 rects for UI blocks with #e4e4e7 stroke
- Red #DC2626 for exactly ONE primary CTA button
- Black #18181b text 12-14px sans-serif
- No gradients, no filters, no complex paths
- Maximum 8 elements per wireframe
- Keep it clean and readable

Generate EXACTLY 3 wireframes. Do NOT over-design.`;

export async function wireframeAgent(stories: UserStory[]): Promise<Wireframe[]> {
  const storySummary = stories
    .slice(0, 8)
    .map((s) => `[${s.id}] ${s.story}`)
    .join("\n");

  return runAgentStructured<Wireframe[]>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `User Stories (top priority):\n${storySummary}\n\nCreate 3 wireframes. Be fast and minimal.`,
    schema: "Wireframe[]",
  });
}

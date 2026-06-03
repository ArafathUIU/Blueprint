import { runAgent } from "../ai";

const SYSTEM_PROMPT = `You are a UI wireframe editor. You receive a wireframe SVG and an edit command. Produce ONLY the updated, valid SVG. No explanations, no markdown — just the SVG element.

RULES:
- Keep the same viewBox as the original
- Keep the same color scheme: white #fff background, gray #f4f4f5 UI blocks, gray #e4e4e7 strokes, red #DC2626 CTA buttons, black #18181b text
- Maximum 8 elements per wireframe
- Only use: <rect>, <text>, <line>, <circle>
- Keep text content inside <text> elements
- Apply ONLY the requested changes — don't redesign unrelated parts
- If the command is ambiguous, make a reasonable interpretation
- Output valid XML that renders in a browser`;

export async function wireframeEditorAgent(
  currentSvg: string,
  command: string
): Promise<string> {
  const response = await runAgent({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Current wireframe SVG:\n${currentSvg}\n\nEdit command: "${command}"\n\nReturn ONLY the updated SVG.`,
    temperature: 0.2,
  });

  // Extract SVG from response
  const svgMatch = response.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) return svgMatch[0];

  // Maybe the LLM returned a bare SVG
  const trimmed = response.trim();
  if (trimmed.startsWith("<svg") && trimmed.endsWith(">")) return trimmed;

  throw new Error("Failed to generate valid SVG from edit");
}

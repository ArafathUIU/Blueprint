import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

const apiKey = process.env.OPENCODE_GO_API_KEY;

if (!apiKey || apiKey === "your-api-key-here") {
  console.warn(
    "OPENCODE_GO_API_KEY not set. AI features will not work. Set it in .env.local"
  );
}

const provider = createOpenAICompatible({
  name: "opencode-go",
  baseURL: "https://opencode.ai/zen/go/v1",
  apiKey,
});

export const model = provider("deepseek-v4-pro");

interface AgentOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export async function runAgent({
  systemPrompt,
  userPrompt,
  temperature = 0.3,
}: AgentOptions): Promise<string> {
  if (!apiKey || apiKey === "your-api-key-here") {
    throw new Error("OPENCODE_GO_API_KEY is not configured");
  }

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature,
  });

  return text;
}

export async function runAgentStructured<T>({
  systemPrompt,
  userPrompt,
  schema,
  temperature = 0.3,
}: AgentOptions & { schema: string }): Promise<T> {
  const text = await runAgent({ systemPrompt, userPrompt, temperature });

  // Extract JSON from markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Try to find JSON anywhere in the response
    const bracketMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (bracketMatch) {
      return JSON.parse(bracketMatch[0]) as T;
    }
    throw new Error(
      `Failed to parse agent response as JSON. Schema: ${schema}. Response: ${text.slice(0, 500)}`
    );
  }
}

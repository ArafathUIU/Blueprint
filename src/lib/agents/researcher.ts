import { runAgentStructured } from "../ai";
import type { MarketResearch } from "../types";

const SYSTEM_PROMPT = `You are an expert market research analyst. Given a product idea, you must produce a comprehensive market research report. Output ONLY valid JSON matching this schema:

{
  "tam": "Total Addressable Market estimate with source",
  "sam": "Serviceable Addressable Market estimate",
  "som": "Serviceable Obtainable Market estimate (Year 1 target)",
  "trends": ["Key market trend 1", "Key market trend 2", "Key market trend 3"],
  "competitors": [
    {
      "name": "Competitor name",
      "strength": "Their main strength",
      "weakness": "Their main weakness",
      "differentiation": "How we differentiate against them"
    }
  ],
  "personas": [
    {
      "name": "Persona name/role",
      "painPoint": "Their main pain point",
      "willingnessToPay": "High/Medium/Low with price range"
    }
  ],
  "viabilityScore": 0-100,
  "summary": "2-3 sentence executive summary of findings"
}

  "sources": [
    { "title": "Source title (e.g. Grand View Research - Digital Health Market 2025)", "url": "https://example.com/report" }
  ]

Provide realistic, well-researched estimates. Include 4-6 real competitors and 3-4 personas. Be specific with numbers. Base on actual market data. Include 3-5 credible sources with URLs for your data points.`;

export async function researchAgent(idea: string): Promise<MarketResearch> {
  return runAgentStructured<MarketResearch>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Product Idea: ${idea}`,
    schema: "MarketResearch",
  });
}

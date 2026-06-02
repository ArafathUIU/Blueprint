import { runAgentStructured } from "../ai";
import type { UserStory } from "../types";

const SYSTEM_PROMPT = `You are an expert product manager specializing in agile user story creation. Given a product idea and its market research, generate 10-15 user stories with acceptance criteria. Output ONLY valid JSON:

Array of:
{
  "id": "US-XXX",
  "epic": "Epic name/theme",
  "story": "As a [persona], I want [feature] so that [benefit]",
  "acceptanceCriteria": ["AC 1", "AC 2", "AC 3"],
  "priority": "P0" | "P1" | "P2",
  "moscow": "Must" | "Should" | "Could" | "Wont"
}

Rules:
- Create 10-15 stories across 3-5 epics
- At least 3 stories must be P0/Must
- Each story should have 2-4 acceptance criteria
- Prioritize by MoSCoW method
- Map stories to the personas identified in research
- Be specific and actionable in acceptance criteria`;

export async function storyAgent(
  idea: string,
  researchSummary: string
): Promise<UserStory[]> {
  return runAgentStructured<UserStory[]>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Product Idea: ${idea}\n\nMarket Research Summary: ${researchSummary}`,
    schema: "UserStory[]",
  });
}

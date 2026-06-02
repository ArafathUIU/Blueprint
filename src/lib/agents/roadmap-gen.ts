import { runAgentStructured } from "../ai";
import type { RoadmapPhase, UserStory } from "../types";

const SYSTEM_PROMPT = `You are an expert technical project manager who creates development roadmaps. Given user stories, generate a phased development plan. Output ONLY valid JSON:

Array of:
{
  "phase": "Phase name (e.g. 'MVP - Core Features')",
  "timeline": "Duration (e.g. 'Weeks 1-4')",
  "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"],
  "stories": ["US-XXX", "US-YYY"]
}

Rules:
- Create 3-4 phases
- Phase 1 must be the MVP with P0/Must stories only
- Each phase should have 3-5 deliverables
- All stories must be assigned to a phase
- Timeline should be realistic (4-6 weeks per phase)
- Later phases can combine P1/P2 stories
- Be specific about what each deliverable is`;

export async function roadmapAgent(stories: UserStory[]): Promise<RoadmapPhase[]> {
  const storySummary = stories
    .map(
      (s) =>
        `[${s.id}][${s.priority}][${s.moscow}] ${s.epic}: ${s.story}`
    )
    .join("\n");

  return runAgentStructured<RoadmapPhase[]>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `User Stories:\n${storySummary}`,
    schema: "RoadmapPhase[]",
  });
}

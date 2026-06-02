export type ProjectStatus =
  | "draft"
  | "researching"
  | "generating_stories"
  | "generating_wireframes"
  | "generating_prd"
  | "generating_roadmap"
  | "complete"
  | "error";

export interface MarketResearch {
  tam: string;
  sam: string;
  som: string;
  trends: string[];
  competitors: Competitor[];
  personas: Persona[];
  viabilityScore: number;
  summary: string;
}

export interface Competitor {
  name: string;
  strength: string;
  weakness: string;
  differentiation: string;
}

export interface Persona {
  name: string;
  painPoint: string;
  willingnessToPay: string;
}

export interface UserStory {
  id: string;
  epic: string;
  story: string;
  acceptanceCriteria: string[];
  priority: "P0" | "P1" | "P2";
  moscow: "Must" | "Should" | "Could" | "Wont";
}

export interface Wireframe {
  id: string;
  title: string;
  description: string;
  svg: string;
  annotations: string[];
  linkedStories: string[];
}

export interface PRD {
  problemStatement: string;
  goals: { goal: string; metric: string; target: string }[];
  targetUsers: string[];
  keyFeatures: { feature: string; description: string; priority: string }[];
  technicalArchitecture: string;
  successMetrics: { metric: string; baseline: string; target: string }[];
  risks: { risk: string; likelihood: string; impact: string; mitigation: string }[];
  dependencies: string[];
}

export interface RoadmapPhase {
  phase: string;
  timeline: string;
  deliverables: string[];
  stories: string[];
}

export interface Project {
  id: string;
  idea: string;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  research: MarketResearch | null;
  stories: UserStory[] | null;
  wireframes: Wireframe[] | null;
  prd: PRD | null;
  roadmap: RoadmapPhase[] | null;
  error: string | null;
}

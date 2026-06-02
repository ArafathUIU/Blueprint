import type { Project } from "../types";
import { researchAgent } from "./researcher";
import { storyAgent } from "./story-gen";
import { wireframeAgent } from "./wireframe-gen";
import { prdAgent } from "./prd-gen";
import { roadmapAgent } from "./roadmap-gen";
import { updateProject } from "../store";

export interface PipelineStep {
  name: string;
  status: "pending" | "running" | "done" | "error";
  error?: string;
}

export async function* runFullPipeline(
  project: Project
): AsyncGenerator<{ step: string; status: string; project: Project }> {
  // Step 1: Research
  yield { step: "research", status: "running", project };
  try {
    const research = await researchAgent(project.idea);
    project = updateProject(project.id, {
      research,
      status: "researching",
    });
    yield { step: "research", status: "done", project };
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    yield {
      step: "research",
      status: "error",
      project: updateProject(project.id, {
        status: "error",
        error: `Research failed: ${errMsg}`,
      }),
    };
    return;
  }

  // Step 2: Stories
  yield { step: "stories", status: "running", project };
  try {
    const stories = await storyAgent(project.idea, project.research!.summary);
    project = updateProject(project.id, {
      stories,
      status: "generating_stories",
    });
    yield { step: "stories", status: "done", project };
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    yield {
      step: "stories",
      status: "error",
      project: updateProject(project.id, {
        status: "error",
        error: `Stories failed: ${errMsg}`,
      }),
    };
    return;
  }

  // Step 3: Wireframes
  yield { step: "wireframes", status: "running", project };
  try {
    const wireframes = await wireframeAgent(project.stories!);
    project = updateProject(project.id, {
      wireframes,
      status: "generating_wireframes",
    });
    yield { step: "wireframes", status: "done", project };
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    yield {
      step: "wireframes",
      status: "error",
      project: updateProject(project.id, {
        status: "error",
        error: `Wireframes failed: ${errMsg}`,
      }),
    };
    return;
  }

  // Step 4: PRD
  yield { step: "prd", status: "running", project };
  try {
    const prd = await prdAgent(
      project.idea,
      project.research!,
      project.stories!,
      project.wireframes!
    );
    project = updateProject(project.id, {
      prd,
      status: "generating_prd",
    });
    yield { step: "prd", status: "done", project };
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    yield {
      step: "prd",
      status: "error",
      project: updateProject(project.id, {
        status: "error",
        error: `PRD failed: ${errMsg}`,
      }),
    };
    return;
  }

  // Step 5: Roadmap
  yield { step: "roadmap", status: "running", project };
  try {
    const roadmap = await roadmapAgent(project.stories!);
    project = updateProject(project.id, {
      roadmap,
      status: "complete",
    });
    yield { step: "roadmap", status: "done", project };
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    yield {
      step: "roadmap",
      status: "error",
      project: updateProject(project.id, {
        status: "error",
        error: `Roadmap failed: ${errMsg}`,
      }),
    };
  }
}

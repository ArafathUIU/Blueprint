import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import type { Project } from "./types";

const DATA_DIR = process.env.DATA_DIR || "./data";

function ensureDir(): string {
  const dir = join(/* turbopackIgnore: true */ process.cwd(), DATA_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function projectPath(id: string): string {
  return join(ensureDir(), `${id}.json`);
}

export function listProjects(): Project[] {
  const dir = ensureDir();
  const files = readdirSync(dir).filter((f: string) => f.endsWith(".json"));
  return files
    .map((f: string) => {
      const raw = readFileSync(join(dir, f), "utf-8");
      return JSON.parse(raw) as Project;
    })
    .sort(
      (a: Project, b: Project) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export function getProject(id: string): Project | null {
  const path = projectPath(id);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8")) as Project;
}

export function saveProject(project: Project): void {
  project.updatedAt = new Date().toISOString();
  writeFileSync(projectPath(project.id), JSON.stringify(project, null, 2), "utf-8");
}

export function createProject(idea: string, name: string): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: uuidv4(),
    idea,
    name,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    research: null,
    stories: null,
    wireframes: null,
    prd: null,
    roadmap: null,
    rawAnalysis: null,
    error: null,
  };
  saveProject(project);
  return project;
}

export function updateProject(id: string, updates: Partial<Project>): Project {
  const project = getProject(id);
  if (!project) throw new Error(`Project ${id} not found`);
  const updated = { ...project, ...updates };
  saveProject(updated);
  return updated;
}

export function deleteProject(id: string): boolean {
  const path = projectPath(id);
  if (!existsSync(path)) return false;
  unlinkSync(path);
  return true;
}

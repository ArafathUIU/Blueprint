import { v4 as uuidv4 } from "uuid";
import type { Project } from "./types";

const STORAGE_KEY = "blueprint_projects";

function isBrowser() {
  return typeof window !== "undefined";
}

function readAll(): Project[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeAll(projects: Project[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function listProjects(): Project[] {
  return readAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getProject(id: string): Project | null {
  return readAll().find((p) => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  const projects = readAll();
  project.updatedAt = new Date().toISOString();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) projects[idx] = project;
  else projects.push(project);
  writeAll(projects);
}

export function createProject(idea: string, name: string): Project {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    idea,
    name: name || idea.slice(0, 50),
    status: "draft",
    createdAt: now,
    updatedAt: now,
    research: null,
    stories: null,
    wireframes: null,
    prd: null,
    roadmap: null,
    error: null,
  };
}

export function deleteProject(id: string): boolean {
  const projects = readAll();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  writeAll(filtered);
  return true;
}

export function updateProject(id: string, updates: Partial<Project>): Project {
  const project = getProject(id);
  if (!project) throw new Error(`Project ${id} not found`);
  const updated = { ...project, ...updates } as Project;
  saveProject(updated);
  return updated;
}

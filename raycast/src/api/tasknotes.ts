import { getPreferenceValues, showToast, Toast } from "@raycast/api";

const { apiBaseUrl } = getPreferenceValues<{ apiBaseUrl: string }>();
const BASE_URL = apiBaseUrl.replace(/\/$/, "");

// ============================================================================
// Types
// ============================================================================

export type TaskStatus = "none" | "open" | "in-progress" | "done";
export type TaskPriority = "none" | "low" | "normal" | "high";
export type TaskContext = "dev" | "work" | "life" | "infra";

export const CONTEXTS: TaskContext[] = ["dev", "work", "life", "infra"];

export interface Task {
  id: string;
  path?: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  scheduled: string | null;
  due: string | null;
  contexts: TaskContext[];
  projects: string[];
  tags: string[];
  dateCreated: string;
  dateModified: string;
  archived: boolean;
  totalTrackedTime: number;
  timeEstimate: string | null;
  isBlocked: boolean;
  isBlocking: boolean;
}

export interface CreateTaskInput {
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  scheduled?: string;
  due?: string;
  contexts: TaskContext[];
  projects?: string[];
  details?: string;
}

export interface NlpParseResult {
  title: string;
  context?: TaskContext;
  priority?: TaskPriority;
  project?: string | null;
  scheduled?: string | null;
  due?: string | null;
}

// ============================================================================
// API Client
// ============================================================================

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "TaskNotes server unreachable",
      message: `Cannot connect to ${BASE_URL}`,
    });
    throw new Error("TaskNotes API unreachable");
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    await showToast({
      style: Toast.Style.Failure,
      title: "API Error",
      message: `${response.status}: ${text}`,
    });
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export async function getTasks(filter?: {
  contexts?: TaskContext[];
  scheduled?: string;
}): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filter?.contexts?.length) {
    params.set("context", filter.contexts[0]);
  }
  if (filter?.scheduled) {
    params.set("scheduled", filter.scheduled);
  }
  const qs = params.toString() ? `?${params.toString()}` : "";
  const tasks = await request<Task[]>(`/tasks${qs}`);
  return tasks.filter((t) => t.status === "open" || t.status === "in-progress");
}

export async function updateTask(id: string, patch: Partial<Pick<Task, "status" | "priority" | "due">>): Promise<Task> {
  const encoded = encodeURIComponent(id);
  return request<Task>(`/tasks/${encoded}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function nlpParse(text: string): Promise<NlpParseResult> {
  return request<NlpParseResult>("/nlp/parse", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function getFilterOptions(): Promise<{ projects: string[] }> {
  return request<{ projects: string[] }>("/filter-options");
}

// ============================================================================
// Helpers
// ============================================================================

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr < today();
}

export function isDueToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === today();
}

export function formatDueDate(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function openInObsidian(taskId: string): void {
  const vaultName = "Vault";
  const uri = `obsidian://advanced-uri?vault=${encodeURIComponent(vaultName)}&filepath=${encodeURIComponent(taskId)}`;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("child_process").exec(`open "${uri}"`);
}

export function extractProjectName(wikilink: string): string {
  return wikilink.replace(/^\[\[|\]\]$/g, "");
}

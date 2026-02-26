import type { CreateTask, FilterOptions, Task, UpdateTask } from '@/types'

const BASE_URL = process.env.TASKNOTES_API_URL ?? 'http://obsidian:8087/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => String(response.status))
    throw new Error(`TaskNotes API error ${response.status}: ${text}`)
  }

  const json = (await response.json()) as { data: T }
  return json.data
}

export async function fetchTasks(query?: Record<string, string>): Promise<{ tasks: Task[] }> {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : ''
  return request<{ tasks: Task[] }>(`/tasks${qs}`)
}

export async function fetchTask(id: string): Promise<Task> {
  return request<Task>(`/tasks/${encodeURIComponent(id)}`)
}

export async function postTask(input: CreateTask): Promise<Task> {
  const payload = {
    ...input,
    tags: ['task'],
    projects: input.projects?.map((p) => `[[${p}]]`) ?? [],
  }
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function patchTask(id: string, patch: UpdateTask): Promise<Task> {
  return request<Task>(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  return request<FilterOptions>('/filter-options')
}

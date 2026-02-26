import { Elysia } from 'elysia'
import { McpServer, StreamableHttpTransport } from 'mcp-lite'
import { z } from 'zod'
import { fetchFilterOptions, fetchTask, fetchTasks, patchTask, postTask } from '@/lib/tasknotes-client'
import { parseWithGemini } from '@/lib/gemini'

const mcp = new McpServer({
  name: 'tasknotes',
  version: '0.1.0',
  schemaAdapter: (schema) => z.toJSONSchema(schema as z.ZodType),
})

mcp.tool('list_tasks', {
  description: 'List tasks with optional filters',
  inputSchema: z.object({
    status: z.enum(['open', 'in-progress', 'done', 'none']).optional().describe('Filter by status'),
    priority: z.enum(['low', 'normal', 'high', 'none']).optional().describe('Filter by priority'),
    context: z.enum(['dev', 'work', 'life', 'infra']).optional().describe('Filter by context'),
    overdue: z.boolean().optional().describe('Only return overdue tasks'),
    scheduled: z.string().optional().describe('Filter by scheduled date (YYYY-MM-DD)'),
  }),
  handler: async ({ status, priority, context, overdue, scheduled }) => {
    const data = await fetchTasks()
    let tasks = data.tasks.filter((t) => !t.archived)
    if (status) tasks = tasks.filter((t) => t.status === status)
    if (priority) tasks = tasks.filter((t) => t.priority === priority)
    if (context) tasks = tasks.filter((t) => t.contexts.includes(context))
    if (overdue) tasks = tasks.filter((t) => t.due && t.due < new Date().toISOString().slice(0, 10))
    if (scheduled) tasks = tasks.filter((t) => t.scheduled === scheduled)
    return { content: [{ type: 'text' as const, text: JSON.stringify(tasks, null, 2) }] }
  },
})

mcp.tool('create_task', {
  description: 'Create a new task',
  inputSchema: z.object({
    title: z.string().min(1).describe('Task title'),
    contexts: z.array(z.enum(['dev', 'work', 'life', 'infra'])).min(1).describe('Task contexts'),
    priority: z.enum(['none', 'low', 'normal', 'high']).optional().describe('Task priority'),
    project: z.string().optional().describe('Project name (exact)'),
    scheduled: z.string().optional().describe('Scheduled date (YYYY-MM-DD)'),
    due: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  }),
  handler: async ({ title, contexts, priority, project, scheduled, due }) => {
    const task = await postTask({
      title,
      contexts,
      priority,
      projects: project ? [project] : [],
      scheduled,
      due,
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(task, null, 2) }] }
  },
})

mcp.tool('update_task', {
  description: 'Update task status, priority, or due date',
  inputSchema: z.object({
    id: z.string().describe('Task id'),
    status: z.enum(['none', 'open', 'in-progress', 'done']).optional(),
    priority: z.enum(['none', 'low', 'normal', 'high']).optional(),
    due: z.string().nullable().optional().describe('Due date (YYYY-MM-DD) or null to clear'),
  }),
  handler: async ({ id, status, priority, due }) => {
    const task = await patchTask(id, { status, priority, due })
    return { content: [{ type: 'text' as const, text: JSON.stringify(task, null, 2) }] }
  },
})

mcp.tool('toggle_task_status', {
  description: 'Toggle a task between open and in-progress',
  inputSchema: z.object({
    id: z.string().describe('Task id'),
  }),
  handler: async ({ id }) => {
    const task = await fetchTask(id)
    const newStatus = task.status === 'in-progress' ? 'open' : 'in-progress'
    const updated = await patchTask(id, { status: newStatus })
    return { content: [{ type: 'text' as const, text: JSON.stringify(updated, null, 2) }] }
  },
})

mcp.tool('nlp_create', {
  description: 'Parse natural language and create a task via Gemini',
  inputSchema: z.object({
    text: z.string().min(1).describe('Natural language task description'),
  }),
  handler: async ({ text }) => {
    const options = await fetchFilterOptions()
    const knownProjects = new Set(options.projects.map((p) => p.replace(/^\[\[|\]\]$/g, '')))
    const parsed = await parseWithGemini(text, [...knownProjects])

    const project = parsed.project && knownProjects.has(parsed.project) ? parsed.project : undefined
    const task = await postTask({
      title: parsed.title,
      contexts: parsed.context ? [parsed.context] : ['dev'],
      priority: parsed.priority ?? 'normal',
      projects: project ? [project] : [],
      scheduled: parsed.scheduled ?? undefined,
      due: parsed.due ?? undefined,
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(task, null, 2) }] }
  },
})

mcp.tool('get_filter_options', {
  description: 'Get live filter options — current contexts, projects, and tags from Obsidian',
  inputSchema: z.object({}),
  handler: async () => {
    const options = await fetchFilterOptions()
    return { content: [{ type: 'text' as const, text: JSON.stringify(options, null, 2) }] }
  },
})

const transport = new StreamableHttpTransport()
const mcpFetch = transport.bind(mcp)

export const mcpHandler = new Elysia()
  .all('/mcp', ({ request }) => mcpFetch(request), {
    detail: { summary: 'MCP StreamableHTTP endpoint', tags: ['MCP'] },
  })

import { Elysia } from 'elysia'
import { z } from 'zod'
import { CreateTaskSchema, UpdateTaskSchema } from '@/types'
import { fetchFilterOptions, fetchTask, fetchTasks, patchTask, postTask } from '@/lib/tasknotes-client'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export const tasksApi = new Elysia({ prefix: '/tasks' })
  .get('/', async ({ query }) => {
    const data = await fetchTasks()
    let tasks = data.tasks

    // Default: exclude archived
    if (query.archived !== 'true') {
      tasks = tasks.filter((t) => !t.archived)
    }

    if (query.status) {
      tasks = tasks.filter((t) => t.status === query.status)
    }
    if (query.priority) {
      tasks = tasks.filter((t) => t.priority === query.priority)
    }
    if (query.context) {
      tasks = tasks.filter((t) => t.contexts.includes(query.context as 'dev' | 'work' | 'life' | 'infra'))
    }
    if (query.overdue === 'true') {
      tasks = tasks.filter((t) => t.due && t.due < today())
    }
    if (query.scheduled) {
      tasks = tasks.filter((t) => t.scheduled === query.scheduled)
    }

    return tasks
  }, {
    query: z.object({
      status: z.string().optional(),
      priority: z.string().optional(),
      context: z.string().optional(),
      overdue: z.string().optional(),
      scheduled: z.string().optional(),
      archived: z.string().optional(),
    }),
    detail: { summary: 'List tasks', tags: ['Tasks'] },
  })

  .get('/:id', async ({ params }) => {
    return fetchTask(params.id)
  }, {
    detail: { summary: 'Get task by id', tags: ['Tasks'] },
  })

  .post('/', async ({ body }) => {
    return postTask(body)
  }, {
    body: CreateTaskSchema,
    detail: { summary: 'Create task', tags: ['Tasks'] },
  })

  .put('/:id', async ({ params, body }) => {
    return patchTask(params.id, body)
  }, {
    body: UpdateTaskSchema,
    detail: { summary: 'Update task', tags: ['Tasks'] },
  })

  .post('/:id/toggle-status', async ({ params }) => {
    const task = await fetchTask(params.id)
    const newStatus = task.status === 'in-progress' ? 'open' : 'in-progress'
    return patchTask(params.id, { status: newStatus })
  }, {
    detail: { summary: 'Toggle task in-progress/open', tags: ['Tasks'] },
  })

export const filterOptionsApi = new Elysia()
  .get('/filter-options', async () => {
    return fetchFilterOptions()
  }, {
    detail: { summary: 'Get live filter options (contexts, projects, tags)', tags: ['Tasks'] },
  })

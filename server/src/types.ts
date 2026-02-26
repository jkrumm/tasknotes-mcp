import { z } from 'zod'

export const TaskStatusSchema = z.enum(['none', 'open', 'in-progress', 'done'])
export const TaskPrioritySchema = z.enum(['none', 'low', 'normal', 'high'])
export const TaskContextSchema = z.enum(['dev', 'work', 'life', 'infra'])

export const TaskSchema = z.object({
  id: z.string(),
  path: z.string().optional(),
  title: z.string(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  scheduled: z.string().nullable(),
  due: z.string().nullable(),
  contexts: z.array(TaskContextSchema),
  projects: z.array(z.string()),
  tags: z.array(z.string()),
  dateCreated: z.string(),
  dateModified: z.string(),
  archived: z.boolean(),
  totalTrackedTime: z.number(),
  timeEstimate: z.string().nullable(),
  isBlocked: z.boolean(),
  isBlocking: z.boolean(),
})

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  scheduled: z.string().optional(),
  due: z.string().optional(),
  contexts: z.array(TaskContextSchema).min(1),
  projects: z.array(z.string()).optional(),
  details: z.string().optional(),
})

export const UpdateTaskSchema = z.object({
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  due: z.string().nullable(),
}).partial()

export const NlpInputSchema = z.object({
  text: z.string().min(1),
})

export const NlpParseResultSchema = z.object({
  title: z.string(),
  context: TaskContextSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  project: z.string().nullable().optional(),
  scheduled: z.string().nullable().optional(),
  due: z.string().nullable().optional(),
})

export const FilterOptionsSchema = z.object({
  statuses: z.array(z.string()),
  priorities: z.array(z.string()),
  contexts: z.array(z.string()),
  projects: z.array(z.string()),
  tags: z.array(z.string()),
})

export type Task = z.infer<typeof TaskSchema>
export type CreateTask = z.infer<typeof CreateTaskSchema>
export type UpdateTask = z.infer<typeof UpdateTaskSchema>
export type NlpInput = z.infer<typeof NlpInputSchema>
export type NlpParseResult = z.infer<typeof NlpParseResultSchema>
export type FilterOptions = z.infer<typeof FilterOptionsSchema>

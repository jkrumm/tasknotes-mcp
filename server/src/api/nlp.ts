import { Elysia } from 'elysia'
import { NlpInputSchema } from '@/types'
import { fetchFilterOptions, postTask } from '@/lib/tasknotes-client'
import { parseWithGemini } from '@/lib/gemini'

export const nlpApi = new Elysia({ prefix: '/nlp' })
  .post('/parse', async ({ body }) => {
    const options = await fetchFilterOptions()
    const projects = options.projects.map((p) => p.replace(/^\[\[|\]\]$/g, ''))
    return parseWithGemini(body.text, projects)
  }, {
    body: NlpInputSchema,
    detail: { summary: 'Parse natural language into task fields', tags: ['NLP'] },
  })

  .post('/create', async ({ body }) => {
    const options = await fetchFilterOptions()
    // Case-insensitive lookup: lowercase key → canonical project name from Obsidian
    const projectMap = new Map(
      options.projects
        .map((p) => p.replace(/^\[\[|\]\]$/g, ''))
        .map((p) => [p.toLowerCase(), p]),
    )
    const parsed = await parseWithGemini(body.text, [...projectMap.values()])

    const matchedProject = parsed.project ? projectMap.get(parsed.project.toLowerCase()) : undefined
    if (parsed.project && !matchedProject) {
      console.warn(`[nlp/create] Unknown project returned by Gemini: "${parsed.project}" — omitting`)
    }

    return postTask({
      title: parsed.title,
      contexts: parsed.context ? [parsed.context] : ['dev'],
      priority: parsed.priority ?? 'normal',
      projects: matchedProject ? [matchedProject] : [],
      scheduled: parsed.scheduled ?? undefined,
      due: parsed.due ?? undefined,
    })
  }, {
    body: NlpInputSchema,
    detail: { summary: 'Parse natural language and create task', tags: ['NLP'] },
  })

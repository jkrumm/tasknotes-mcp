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
    const knownProjects = new Set(options.projects.map((p) => p.replace(/^\[\[|\]\]$/g, '')))
    const parsed = await parseWithGemini(body.text, [...knownProjects])

    const project = parsed.project && knownProjects.has(parsed.project) ? parsed.project : undefined
    if (parsed.project && !knownProjects.has(parsed.project)) {
      console.warn(`[nlp/create] Unknown project returned by Gemini: "${parsed.project}" — omitting`)
    }

    return postTask({
      title: parsed.title,
      contexts: parsed.context ? [parsed.context] : ['dev'],
      priority: parsed.priority ?? 'normal',
      projects: project ? [project] : [],
      scheduled: parsed.scheduled ?? undefined,
      due: parsed.due ?? undefined,
    })
  }, {
    body: NlpInputSchema,
    detail: { summary: 'Parse natural language and create task', tags: ['NLP'] },
  })

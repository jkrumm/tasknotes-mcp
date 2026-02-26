import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { NlpParseResultSchema } from '@/types'
import type { NlpParseResult } from '@/types'

function buildSystemPrompt(today: string, availableProjects: string[]): string {
  const projectList = availableProjects.length ? availableProjects.join(', ') : 'none'
  return `Today: ${today}

Contexts (required, pick exactly one):
- dev: coding, programming, software tasks (basalt-ui, rollhook, open-news, free-planning-poker, any code work)
- work: IU university, courses, PR/reviews, meetings, non-coding professional tasks
- life: personal, health, shopping, errands, social
- infra: homelab, server, docker, networking, infrastructure

Available projects: ${projectList}
Priorities: none, low, normal, high (default: normal)

Project rules:
- Only assign a project if the task explicitly or strongly implies one of the available projects
- When uncertain, omit (return null) — do not guess
- life and infra tasks rarely need a project

Return scheduled/due as YYYY-MM-DD or null. If no explicit date, scheduled defaults to today.`
}

export async function parseWithGemini(text: string, availableProjects: string[]): Promise<NlpParseResult> {
  const today = new Date().toISOString().slice(0, 10)
  const { object } = await generateObject({
    model: google('gemini-3-flash-preview'),
    schema: NlpParseResultSchema,
    system: buildSystemPrompt(today, availableProjects),
    prompt: text,
  })
  return object
}

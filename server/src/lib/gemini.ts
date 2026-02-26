import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { NlpParseResultSchema } from '@/types'
import type { NlpParseResult } from '@/types'

function buildSystemPrompt(today: string, availableProjects: string[]): string {
  return `Today: ${today}
Contexts (pick 1): dev, work, life, infra
Available projects: ${availableProjects.join(', ')}
Priorities: none, low, normal, high (default: normal)
Context mapping: dev=coding/basalt/rollhook/open-news, work=iu/PR/review/meeting, life=personal/buy/health, infra=server/homelab/docker
Common abbreviations: basalt=basalt-ui, fpp/poker=free-planning-poker, news=open-news
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

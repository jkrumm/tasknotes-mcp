import { Elysia } from 'elysia'
import { fetchFilterOptions } from '@/lib/tasknotes-client'
import pkg from '../package.json'

export const healthApi = new Elysia()
  .get('/health', async () => {
    let tasknotesOk = false
    try {
      await fetchFilterOptions()
      tasknotesOk = true
    }
    catch {}

    return {
      status: tasknotesOk ? 'ok' : 'degraded',
      version: pkg.version,
      commit: process.env.COMMIT_SHA ?? 'dev',
      tasknotes: tasknotesOk,
    }
  }, {
    detail: { summary: 'Health check', tags: ['Health'] },
  })

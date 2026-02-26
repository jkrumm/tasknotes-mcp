import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import { healthApi } from '@/api/health'
import { filterOptionsApi, tasksApi } from '@/api/tasks'
import { nlpApi } from '@/api/nlp'
import { mcpHandler } from '@/mcp'

const SCALAR_HTML = `<!doctype html><html><head><title>TaskNotes API</title></head>
<body><script id="api-reference" data-url="/openapi.json"></script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script></body></html>`

export const app = new Elysia()
  .use(openapi({
    path: '/openapi',
    documentation: {
      info: { title: 'TaskNotes API', version: '0.1.0' },
      tags: [
        { name: 'Tasks' },
        { name: 'NLP' },
        { name: 'Health' },
        { name: 'MCP' },
      ],
    },
  }))
  .get('/docs', () => new Response(SCALAR_HTML, { headers: { 'Content-Type': 'text/html' } }))
  .use(healthApi)
  .use(filterOptionsApi)
  .use(tasksApi)
  .use(nlpApi)
  .use(mcpHandler)

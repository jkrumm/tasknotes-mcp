# tasknotes-mcp

Raycast extension + Elysia backend + MCP server for managing tasks in an Obsidian vault via the TaskNotes plugin.

## Components

- **server/** — Elysia (Bun) backend deployed at `tasknotes.jkrumm.com`
- **server/src/mcp/** — MCP server at `/mcp` (mcp-lite, StreamableHTTP)
- **raycast/** — Raycast extension, reads `apiBaseUrl` preference

## MCP Tools

| Tool | Description |
|-|-|
| `list_tasks` | List tasks with optional status/priority/context/date filters |
| `create_task` | Create a task with structured fields |
| `update_task` | Update status, priority, or due date |
| `toggle_task_status` | Toggle between open ↔ in-progress |
| `nlp_create` | Parse natural language via Gemini and create task |
| `get_filter_options` | Fetch live projects/contexts/tags from Obsidian |

## Claude Code MCP Setup

```bash
claude mcp add --transport http tasknotes https://tasknotes.jkrumm.com/mcp
```

No auth required — Tailscale handles network access.

## Server Environment Variables

| Variable | Default |
|-|-|
| `TASKNOTES_API_URL` | `http://obsidian:8087/api` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | — |
| `PORT` | `3000` |

## Deploy

CI builds a Docker image on push to `master` and deploys via rollhook. See `.github/workflows/ci.yml`.

## Raycast Extension

Set `apiBaseUrl` preference to `https://tasknotes.jkrumm.com` (default). Run with:

```bash
cd raycast && npm install && npm run dev
```

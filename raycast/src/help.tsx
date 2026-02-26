import { Detail } from "@raycast/api";

const HELP_MARKDOWN = `
# TaskNotes — Help & Reference

## Commands

| Command | Description |
|-|-|
| **My Tasks** | List view — tasks grouped by context |
| **Add Task** | Structured form — create with all fields |
| **Quick Add** | Natural language → pre-filled form |

## Keyboard Shortcuts (My Tasks)

| Shortcut | Action |
|-|-|
| \`Enter\` | Open task in Obsidian |
| \`⌘T\` | Toggle in-progress / open |
| \`⌘D\` | Mark done (removes from list) |
| \`⌘N\` | Open Add Task form |
| \`⌘R\` | Refresh task list |

## Contexts

Exactly **1 context** is required per task:

| Context | Purpose |
|-|-|
| \`dev\` | Personal project development (basalt-ui, FPP, open-news) |
| \`work\` | Professional work at iu |
| \`life\` | Personal errands, family, health |
| \`infra\` | Homelab & infrastructure tasks |

## Projects

| Project | Description |
|-|-|
| \`basalt-ui\` | Framework-agnostic Tailwind design system |
| \`free-planning-poker\` | Open-source planning poker app |
| \`open-news\` | RSS aggregation & AI news briefing |
| \`iu\` | Work projects umbrella |
| \`rollhook\` | Rollhook project |

## Priority

| Priority | Indicator |
|-|-|
| high | Red filled circle |
| normal | Yellow filled circle |
| low | Grey filled circle |
| none | No indicator |

## Quick Add — Natural Language Examples

\`\`\`
Fix dark mode for basalt high
Review PR for iu work tomorrow
Call dentist life next monday
Deploy homelab infra due friday
\`\`\`

Supported patterns:
- **Priority:** \`low\`, \`normal\`, \`high\`
- **Context:** \`@dev\`, \`@work\`, \`@life\`, \`@infra\`
- **Dates:** \`today\`, \`tomorrow\`, \`next monday\`, \`YYYY-MM-DD\`
- **Tags:** \`#topic\`

## Tips

- Due dates shown in **red** when overdue or due today
- In-progress tasks show a ⚡ bolt icon
- Filter by context or "Today" using the dropdown
- Tasks created here appear instantly in Obsidian (TaskNotes plugin)
`;

export default function Help() {
  return <Detail markdown={HELP_MARKDOWN} />;
}

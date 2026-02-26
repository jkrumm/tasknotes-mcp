import process from 'node:process'
import { app } from '@/app'

const port = Number(process.env.PORT ?? 3000)
app.listen(port, () => {
  process.stdout.write(`TaskNotes server running on http://localhost:${port}\n`)
})

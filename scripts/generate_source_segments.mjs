import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const input = process.argv[2]
const output = process.argv[3] ?? 'src/content/sourceSegments.ts'

if (!input) {
  throw new Error('Usage: node scripts/generate_source_segments.mjs <transcript.txt> [output.ts]')
}

const source = readFileSync(resolve(input), 'utf8')
const matches = [...source.matchAll(/Speaker\s+(\d+)\s+(\d{2}:\d{2}:\d{2}\.\d{3})/g)]

const seconds = (time) => {
  const [hours, minutes, remainder] = time.split(':')
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(remainder)
}

const rows = matches.map((match, index) => ({
  id: `s${String(index + 1).padStart(3, '0')}`,
  speaker: Number(match[1]),
  start: Number(seconds(match[2]).toFixed(3)),
  startText: match[2],
}))

const body = `import type { SourceSegment } from './types'\n\nexport const sourceSegments: SourceSegment[] = ${JSON.stringify(rows, null, 2)}\n`
writeFileSync(resolve(output), body, 'utf8')
console.log(`Wrote ${rows.length} source segments to ${output}`)

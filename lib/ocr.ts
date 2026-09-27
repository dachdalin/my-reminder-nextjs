export interface OcrReminderFields {
  title: string
  place: string
  participants: string
  meetingDate: string
  meetingTime: string
}

const KHMER_DIGITS = '០១២៣៤៥៦៧៨៩'
const FIELD_LABELS = [
  'ចំណងជើង', 'ប្រធានបទ', 'title', 'subject',
  'ទីតាំង', 'កន្លែង', 'place', 'location',
  'អ្នកត្រូវចូលរួម', 'អ្នកចូលរួម', 'who', 'participants', 'attendees',
  'កាលបរិច្ឆេទប្រជុំ', 'កាលបរិច្ឆេទ', 'meeting date', 'date', 'when',
  'ម៉ោងប្រជុំ', 'ម៉ោង', 'meeting time', 'time',
]

function toLatinDigits(value: string) {
  return value.replace(/[០-៩]/g, (digit) => String(KHMER_DIGITS.indexOf(digit)))
}

function clean(value: string) {
  return value.replace(/^[\s:：\-–—]+|[\s:：\-–—]+$/g, '').trim()
}

function normalizedLine(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function findLabelIndex(lines: string[], labels: string[]) {
  const orderedLabels = [...labels].sort((a, b) => b.length - a.length)
  return lines.findIndex((line) => {
    const normalized = normalizedLine(line)
    return orderedLabels.some((label) => {
      const normalizedLabel = normalizedLine(label)
      return normalized === normalizedLabel ||
        normalized.startsWith(`${normalizedLabel}:`) ||
        normalized.startsWith(`${normalizedLabel} `) ||
        normalized.startsWith(`${normalizedLabel}-`)
    })
  })
}

function valueAfterLabel(lines: string[], labels: string[]) {
  const index = findLabelIndex(lines, labels)

  if (index < 0) return ''

  const label = [...labels]
    .sort((a, b) => b.length - a.length)
    .find((candidate) => {
      const normalized = normalizedLine(lines[index])
      const normalizedCandidate = normalizedLine(candidate)
      return normalized === normalizedCandidate ||
        normalized.startsWith(`${normalizedCandidate}:`) ||
        normalized.startsWith(`${normalizedCandidate} `) ||
        normalized.startsWith(`${normalizedCandidate}-`)
    })
  const sameLine = label
    ? lines[index].slice(lines[index].toLowerCase().indexOf(label.toLowerCase()) + label.length)
    : ''
  const nextLine = lines[index + 1]
  return clean(sameLine) || (nextLine && findLabelIndex([nextLine], FIELD_LABELS) < 0 ? clean(nextLine) : '')
}

function parseDate(text: string) {
  const normalized = toLatinDigits(text)
  const match = normalized.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})|(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})|(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (!match) {
    const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
    const wordMatch = normalized.match(/\b(\d{1,2})\s+([^\s]+)\s+(\d{4})\b/)
    if (!wordMatch) return ''
    const month = khmerMonths.indexOf(wordMatch[2]) + 1
    if (month === 0) return ''
    return `${wordMatch[3]}-${String(month).padStart(2, '0')}-${String(wordMatch[1]).padStart(2, '0')}`
  }

  const year = match[1] ?? match[6] ?? match[7]
  const month = match[2] ?? match[5] ?? match[8]
  const day = match[3] ?? match[4] ?? match[9]
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) return ''

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseTime(text: string) {
  const normalized = toLatinDigits(text).replace(/ព្រឹក|ព.រ/gi, 'AM').replace(/រសៀល|ល្ងាច|យប់|ក.រ/gi, 'PM')
  const match = normalized.match(/\b(\d{1,2})\s*[:.ៈ]\s*(\d{1,2})\s*(AM|PM)?\b/i)
  if (!match) return ''

  let hour = Number(match[1])
  const minute = Number(match[2])
  const period = match[3]?.toUpperCase()
  if (minute > 59 || hour > 23) return ''
  if (period === 'PM' && hour < 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function parseOcrReminderFields(text: string): OcrReminderFields {
  const lines = text
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean)

  const titleLabels = ['ចំណងជើង', 'ប្រធានបទ','ដើម្បីចូលរួម','ដើម្បី', 'title', 'subject']
  const title = valueAfterLabel(lines, titleLabels) || lines.find((line) => findLabelIndex([line], FIELD_LABELS) < 0) || ''
  const place = valueAfterLabel(lines, ['ទីតាំង', 'ទីកន្លែង','កន្លែង', 'place', 'location'])
  const dateLabels = ['កាលបរិច្ឆេទប្រជុំ', 'កាលបរិច្ឆេទ', 'meeting date', 'date', 'when']
  const timeLabels = ['ម៉ោងប្រជុំ', 'វេលាម៉ោង','ម៉ោង', 'meeting time', 'time']
  const participantLabels = ['អ្នកត្រូវចូលរួម','សូមអញ្ជើញ','ចាត់អញ្ជើញ', 'អ្នកចូលរួម', 'who', 'participants', 'attendees']
  const dateLine = valueAfterLabel(lines, dateLabels)
  const timeLine = valueAfterLabel(lines, timeLabels)
  const participantsLine = valueAfterLabel(lines, participantLabels)

  let participants = participantsLine
  const participantIndex = findLabelIndex(lines, participantLabels)
  if (participantIndex >= 0 && !participants) {
    const nextFieldIndex = lines.findIndex((line, index) => index > participantIndex && findLabelIndex([line], FIELD_LABELS) >= 0)
    participants = lines.slice(participantIndex + 1, nextFieldIndex < 0 ? undefined : nextFieldIndex).join('\n')
  }

  return {
    title,
    place,
    participants,
    meetingDate: parseDate(dateLine) || parseDate(text),
    meetingTime: parseTime(timeLine) || parseTime(text),
  }
}

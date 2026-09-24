export interface OcrReminderFields {
  title: string
  place: string
  participants: string
  meetingDate: string
  meetingTime: string
}

const KHMER_DIGITS = '០១២៣៤៥៦៧៨៩'

function toLatinDigits(value: string) {
  return value.replace(/[០-៩]/g, (digit) => String(KHMER_DIGITS.indexOf(digit)))
}

function clean(value: string) {
  return value.replace(/^[\s:：\-–—]+|[\s:：\-–—]+$/g, '').trim()
}

function valueAfterLabel(lines: string[], labels: string[]) {
  const normalizedLabels = labels.map((label) => label.toLowerCase())
  const index = lines.findIndex((line) => {
    const normalized = line.toLowerCase()
    return normalizedLabels.some((label) => normalized.startsWith(label))
  })

  if (index < 0) return ''

  const sameLine = lines[index].replace(/^.*?(?:[:：]|-)/, '')
  return clean(sameLine) || clean(lines[index + 1] ?? '')
}

function parseDate(text: string) {
  const normalized = toLatinDigits(text)
  const match = normalized.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b|\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/)
  if (!match) {
    const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
    const wordMatch = normalized.match(/\b(\d{1,2})\s+([^\s]+)\s+(\d{4})\b/)
    if (!wordMatch) return ''
    const month = khmerMonths.indexOf(wordMatch[2]) + 1
    if (month === 0) return ''
    return `${wordMatch[3]}-${String(month).padStart(2, '0')}-${String(wordMatch[1]).padStart(2, '0')}`
  }

  const year = match[1] ?? match[6]
  const month = match[2] ?? match[5]
  const day = match[3] ?? match[4]
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) return ''

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseTime(text: string) {
  const normalized = toLatinDigits(text)
  const match = normalized.match(/\b(\d{1,2})\s*[:.ៈ]\s*(\d{2})\s*(AM|PM)?\b/i)
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

  const title = valueAfterLabel(lines, ['ចំណងជើង', 'ប្រធានបទ', 'title', 'subject']) || lines[0] || ''
  const place = valueAfterLabel(lines, ['ទីតាំង', 'កន្លែង', 'place', 'location'])
  const dateLine = valueAfterLabel(lines, ['កាលបរិច្ឆេទប្រជុំ', 'កាលបរិច្ឆេទ', 'កាលបរិច្ឆេទ', 'date'])
  const timeLine = valueAfterLabel(lines, ['ម៉ោងប្រជុំ', 'ម៉ោង', 'time'])
  const participantsLine = valueAfterLabel(lines, ['អ្នកត្រូវចូលរួម', 'អ្នកចូលរួម', 'participants', 'attendees'])

  let participants = participantsLine
  const participantIndex = lines.findIndex((line) =>
    ['អ្នកត្រូវចូលរួម', 'អ្នកចូលរួម', 'participants', 'attendees'].some((label) =>
      line.toLowerCase().startsWith(label.toLowerCase())
    )
  )
  if (participantIndex >= 0 && !participants) {
    participants = lines.slice(participantIndex + 1).filter((line) => !/^(កាលបរិច្ឆេទ|ម៉ោង|date|time)/i.test(line)).join('\n')
  }

  return {
    title,
    place,
    participants,
    meetingDate: parseDate(dateLine) || parseDate(text),
    meetingTime: parseTime(timeLine) || parseTime(text),
  }
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']

export const KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
]


export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function toKhmerNumber(value: number): string {
  return value
    .toString()
    .split('')
    .map((digit) => KHMER_DIGITS[Number(digit)])
    .join('')
}

/**
 * Converts a 24-hour "HH:MM" string to a Khmer time label.
 * Examples:
 *   "08:00" → "៨ៈ០០ នាទីព្រឹក"
 *   "14:00" → "២ៈ០០ នាទីរសៀល"
 *   "00:30" → "១២ៈ៣០ នាទីអធ្រាត្រ"
 */
export function toKhmerTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)

  let period: string
  let displayHour: number

  if (h === 0) {
    period = 'នាទីអធ្រាត្រ' // midnight
    displayHour = 12
  } else if (h < 12) {
    period = 'នាទីព្រឹក' // morning (AM)
    displayHour = h
  } else if (h === 12) {
    period = 'នាទីថ្ងៃត្រង់' // noon
    displayHour = 12
  } else {
    period = 'នាទីរសៀល' // afternoon/PM
    displayHour = h - 12
  }

  const khmerHour = toKhmerNumber(displayHour)
  const khmerMinute = toKhmerNumber(m).padStart(2, '០')
  return `${khmerHour}ៈ${khmerMinute} ${period}`
}

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('[Telegram] TELEGRAM_BOT_TOKEN not configured')
    return false
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      }
    )

    if (!response.ok) {
      const body = await response.text()
      console.error(`[Telegram] Failed to send (${response.status}):`, body)
      return false
    }

    return true
  } catch (error) {
    console.error('[Telegram] Network error:', error)
    return false
  }
}

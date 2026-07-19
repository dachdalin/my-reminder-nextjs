import { db } from '@/lib/db'
import { reminders, telegramConnection } from '@/lib/db/schema'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TIME_ZONE = process.env.REMINDER_TIME_ZONE ?? 'Asia/Phnom_Penh'

type Reminder = typeof reminders.$inferSelect

export async function GET(request: Request) {
  return sendTomorrowReminders(request)
}

export async function POST(request: Request) {
  return sendTomorrowReminders(request)
}

async function sendTomorrowReminders(request: Request) {
  const authToken = request.headers.get('Authorization')
  const expectedToken = process.env.CRON_SECRET || process.env.REMINDER_CRON_SECRET

  if (!authToken || !expectedToken || authToken !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN is not configured' },
      { status: 500 }
    )
  }

  try {
    const tomorrow = getTomorrowDateKey()
    console.log(`[Cron] Checking reminders. Timezone: ${TIME_ZONE}, Current local time: ${new Date().toLocaleString('en-US', { timeZone: TIME_ZONE })}, Target date: ${tomorrow}`)

    const rows = await db
      .select({
        reminder: reminders,
        telegramConnection,
      })
      .from(reminders)
      .innerJoin(
        telegramConnection,
        eq(reminders.userId, telegramConnection.userId)
      )
      .where(
        and(eq(reminders.meetingDate, tomorrow), isNull(reminders.sentAt))
      )

    const remindersByChat = new Map<string, Reminder[]>()

    for (const row of rows) {
      const chatId = row.telegramConnection.telegramChatId
      remindersByChat.set(chatId, [
        ...(remindersByChat.get(chatId) ?? []),
        row.reminder,
      ])
    }

    let sentCount = 0
    const sentIds: number[] = []

    for (const [chatId, chatReminders] of remindersByChat) {
      const message = formatTomorrowMessage(chatReminders)
      const didSend = await sendTelegramMessage(chatId, message)

      if (didSend) {
        sentCount++
        sentIds.push(...chatReminders.map((reminder) => reminder.id))
      }
    }

    if (sentIds.length > 0) {
      await db
        .update(reminders)
        .set({ sentAt: new Date() })
        .where(inArray(reminders.id, sentIds))
    }

    return NextResponse.json({
      success: true,
      meetingDate: tomorrow,
      sentChats: sentCount,
      totalItems: rows.length,
    })
  } catch (error) {
    console.error('Error in reminder cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function sendTelegramMessage(chatId: string, text: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    }
  )

  if (!response.ok) {
    console.error('Failed to send Telegram reminder:', response.statusText)
    return false
  }

  return true
}

function formatTomorrowMessage(items: Reminder[]) {
  const lines = ['🔔 <b>ជូនដំណឹង សម្រាប់ថ្ងៃស្អែក</b>', '']

  items.forEach((item, index) => {
    const participants = item.participants
      .split('\n')
      .map((participant) => participant.trim())
      .filter(Boolean)

    lines.push(`${toKhmerNumber(index + 1)}. ${escapeHtml(item.title)}`)
    lines.push(`📍 ទីតាំង: ${escapeHtml(item.place)}`)
    lines.push(`👉 អ្នកចូលរួម:`)
    for (const participant of participants) {
      lines.push(`   - ${escapeHtml(participant)}`)
    }

    lines.push('')
  })

  lines.push('សូមអរគុណ🙏')

  return lines.join('\n')
}

function getTomorrowDateKey() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const todayKey = formatter.format(new Date())
  const tomorrow = new Date(`${todayKey}T00:00:00.000Z`)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return tomorrow.toISOString().slice(0, 10)
}

function toKhmerNumber(value: number) {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
  return value
    .toString()
    .split('')
    .map((digit) => khmerDigits[Number(digit)])
    .join('')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

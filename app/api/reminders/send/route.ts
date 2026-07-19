import { db } from '@/lib/db'
import { reminders, telegramConnection } from '@/lib/db/schema'
import type { SelectReminder } from '@/lib/db/schema'
import { sendTelegramMessage, escapeHtml, toKhmerNumber } from '@/lib/telegram'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const TIME_ZONE = process.env.REMINDER_TIME_ZONE ?? 'Asia/Phnom_Penh'

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

  try {
    const tomorrow = getTomorrowDateKey()
    console.log(
      `[Cron] Timezone: ${TIME_ZONE}, Local: ${new Date().toLocaleString('en-US', { timeZone: TIME_ZONE })}, Target: ${tomorrow}`
    )

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

    const remindersByChat = new Map<string, SelectReminder[]>()

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
    console.error('[Cron] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatTomorrowMessage(items: SelectReminder[]) {
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

import { db } from '@/lib/db'
import { reminders as reminder, telegramConnection } from '@/lib/db/schema'
import { and, eq, lte } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function POST(request: Request) {
  // Verify authorization token from header
  const authToken = request.headers.get('Authorization')
  const expectedToken = process.env.REMINDER_CRON_SECRET

  if (!authToken || !expectedToken || authToken !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const now = new Date()

    // Get all reminders that are due
    const dueReminders = await db
      .select({
        reminder: reminder,
        telegramConnection: telegramConnection,
      })
      .from(reminder)
      .leftJoin(
        telegramConnection,
        eq(reminder.userId, telegramConnection.userId)
      )
      .where(
        and(
          lte(reminder.scheduledTime, now),
          // Assuming we add a 'sent' column later to track sent reminders
        )
      )

    let sentCount = 0

    for (const { reminder: rem, telegramConnection: tg } of dueReminders) {
      if (!tg || !TELEGRAM_BOT_TOKEN) continue

      const message = formatReminderMessage(rem)

      try {
        const response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: tg.telegramChatId,
              text: message,
              parse_mode: 'HTML',
            }),
          }
        )

        if (response.ok) {
          sentCount++
        } else {
          console.error(
            `Failed to send reminder ${rem.id} to user ${rem.userId}:`,
            response.statusText
          )
        }
      } catch (error) {
        console.error(
          `Error sending reminder ${rem.id} to Telegram:`,
          error
        )
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      totalDue: dueReminders.length,
    })
  } catch (error) {
    console.error('Error in reminder cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatReminderMessage(rem: any): string {
  let message = `<b>⏰ Reminder: ${rem.title}</b>\n\n`

  if (rem.description) {
    message += `${rem.description}\n\n`
  }

  message += `<i>Scheduled: ${new Date(rem.scheduledTime).toLocaleString()}</i>`

  return message
}

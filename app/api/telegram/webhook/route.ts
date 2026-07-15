import { db } from '@/lib/db'
import { telegramConnection } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

interface TelegramMessage {
  message?: {
    chat: {
      id: number
    }
    from: {
      id: number
      username?: string
    }
    text: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: TelegramMessage = await request.json()

    if (data.message?.text === '/start') {
      const chatId = data.message.chat.id.toString()
      const telegramUserId = data.message.from.id.toString()

      await sendTelegramMessage(
        chatId,
        '👋 Hello! Your Telegram account is now ready to receive reminders.\n\n' +
          'You can create reminders from the web app and they will be sent to you here.'
      )

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function sendTelegramMessage(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not set')
    return false
  }

  try {
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
      console.error('Failed to send Telegram message:', response.statusText)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Telegram message:', error)
    return false
  }
}

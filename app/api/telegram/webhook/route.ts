import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

interface TelegramMessage {
  message?: {
    chat: {
      id: number
      title?: string
      type?: string
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
      const chatName =
        data.message.chat.title ??
        data.message.from.username ??
        data.message.chat.type ??
        'this chat'

      await sendTelegramMessage(
        chatId,
        `Telegram target ready for ${escapeHtml(chatName)}.\n\n` +
          `Chat ID: <code>${escapeHtml(chatId)}</code>\n\n` +
          'Copy this chat ID into the web app.'
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
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

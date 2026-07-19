import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage, escapeHtml } from '@/lib/telegram'

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
        'ឆាតនេះ'

      await sendTelegramMessage(
        chatId,
        `បានរៀបចំគោលដៅ Telegram សម្រាប់ ${escapeHtml(chatName)} រួចរាល់។\n\n` +
          `លេខសម្គាល់ឆាត៖ <code>${escapeHtml(chatId)}</code>\n\n` +
          'សូមចម្លងលេខសម្គាល់ឆាតនេះទៅក្នុងប្រព័ន្ធ។'
      )

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

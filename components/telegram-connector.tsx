'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Check, Copy } from 'lucide-react'

interface TelegramConnectorProps {
  isConnected: boolean
  onConnect: () => void
}

export default function TelegramConnector({ isConnected, onConnect }: TelegramConnectorProps) {
  const [copied, setCopied] = useState(false)

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'reminder_bot'
  const botLink = `https://t.me/${botUsername}`

  const handleCopyCommand = () => {
    const command = `/start`
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <Check className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">Connected to Telegram</p>
          <p className="text-xs text-muted-foreground">Reminders will be sent via Telegram</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-secondary/10 rounded-lg border border-border text-sm text-muted-foreground">
        <span className="text-lg mt-0.5">📱</span>
        <p>
          Connect your Telegram account to receive reminders via Telegram notifications.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => window.open(botLink, '_blank')}
          className="w-full bg-primary hover:bg-primary/90 gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Open Telegram Bot
        </Button>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Then send this command:
          </label>
          <div className="flex gap-2">
            <code className="flex-1 px-3 py-2 bg-secondary rounded text-sm text-foreground font-mono">
              /start
            </code>
            <button
              onClick={handleCopyCommand}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>📝 Steps:</p>
        <ol className="list-decimal list-inside space-y-1 ml-1">
          <li>Click &apos;Open Telegram Bot&apos;</li>
          <li>Send the /start command</li>
          <li>Confirm the connection</li>
        </ol>
      </div>
    </div>
  )
}

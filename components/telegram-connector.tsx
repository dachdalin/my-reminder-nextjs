'use client'

import { useState } from 'react'
import { saveTelegramConnection } from '@/app/actions/reminders'
import { Button } from '@/components/ui/button'
import { Check, Copy, MessageCircle } from 'lucide-react'

interface TelegramConnectorProps {
  isConnected: boolean
  onConnect: () => void
}

export default function TelegramConnector({
  isConnected,
  onConnect,
}: TelegramConnectorProps) {
  const [copied, setCopied] = useState(false)
  const [chatId, setChatId] = useState('')
  const [telegramUserId, setTelegramUserId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'reminder_bot'
  const botLink = `https://t.me/${botUsername}`

  const handleCopyCommand = () => {
    navigator.clipboard.writeText('/start')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!chatId.trim()) {
      setError('Telegram chat ID is required')
      return
    }

    setIsSaving(true)
    try {
      await saveTelegramConnection(chatId.trim(), telegramUserId.trim())
      setChatId('')
      setTelegramUserId('')
      onConnect()
    } catch (err) {
      console.error(err)
      setError('Failed to save Telegram target')
    } finally {
      setIsSaving(false)
    }
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
        <Check className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">Telegram target saved</p>
          <p className="text-xs text-muted-foreground">
            Tomorrow meeting digests will be sent to this chat.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/10 p-4 text-sm text-muted-foreground">
        <span className="mt-0.5 text-lg">📱</span>
        <p>Add the bot to a private chat or group, send /start, then save the chat ID here.</p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => window.open(botLink, '_blank')}
          className="w-full gap-2 bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="h-4 w-4" />
          Open Telegram Bot
        </Button>

        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Send this command in the target chat:
          </label>
          <div className="flex gap-2">
            <code className="flex-1 rounded bg-secondary px-3 py-2 font-mono text-sm text-foreground">
              /start
            </code>
            <button
              type="button"
              onClick={handleCopyCommand}
              className="rounded bg-secondary px-3 py-2 transition-colors hover:bg-secondary/80"
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Telegram chat ID
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(event) => setChatId(event.target.value)}
              placeholder="Private or group chat ID"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Telegram user ID
            </label>
            <input
              type="text"
              value={telegramUserId}
              onChange={(event) => setTelegramUserId(event.target.value)}
              placeholder="Optional"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSaving}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save Telegram Target'}
          </Button>
        </form>
      </div>
    </div>
  )
}

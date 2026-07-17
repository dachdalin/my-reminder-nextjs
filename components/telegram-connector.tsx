'use client'

import { useState } from 'react'
import { saveTelegramConnection } from '@/app/actions/reminders'
import { Button } from '@/components/ui/button'
import { Check, Copy, MessageCircle } from 'lucide-react'

interface TelegramConnectorProps {
  isConnected: boolean
  connection: {
    telegramChatId: string
    telegramUserId?: string | null
  } | null
  onConnect: () => void
}

export default function TelegramConnector({
  isConnected,
  connection,
  onConnect,
}: TelegramConnectorProps) {
  const [copied, setCopied] = useState(false)
  const [chatId, setChatId] = useState(connection?.telegramChatId ?? '')
  const [telegramUserId, setTelegramUserId] = useState(
    connection?.telegramUserId ?? ''
  )
  const [isEditing, setIsEditing] = useState(!isConnected)
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
      setIsEditing(false)
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
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Telegram target saved</p>
              <p className="text-xs text-muted-foreground break-all">
                Chat ID: {connection?.telegramChatId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
          >
            {isEditing ? 'Close' : 'Edit'}
          </button>
        </div>

        {isEditing && (
          <TelegramTargetForm
            botLink={botLink}
            chatId={chatId}
            copied={copied}
            error={error}
            isSaving={isSaving}
            telegramUserId={telegramUserId}
            onChatIdChange={setChatId}
            onCopyCommand={handleCopyCommand}
            onSubmit={handleSave}
            onTelegramUserIdChange={setTelegramUserId}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/10 p-4 text-sm text-muted-foreground">
        <span className="mt-0.5 text-lg">📱</span>
        <p>Add the bot to a private chat or group, send /start, then save the chat ID here.</p>
      </div>

      <TelegramTargetForm
        botLink={botLink}
        chatId={chatId}
        copied={copied}
        error={error}
        isSaving={isSaving}
        telegramUserId={telegramUserId}
        onChatIdChange={setChatId}
        onCopyCommand={handleCopyCommand}
        onSubmit={handleSave}
        onTelegramUserIdChange={setTelegramUserId}
      />
    </div>
  )
}

function TelegramTargetForm({
  botLink,
  chatId,
  copied,
  error,
  isSaving,
  telegramUserId,
  onChatIdChange,
  onCopyCommand,
  onSubmit,
  onTelegramUserIdChange,
}: {
  botLink: string
  chatId: string
  copied: boolean
  error: string
  isSaving: boolean
  telegramUserId: string
  onChatIdChange: (value: string) => void
  onCopyCommand: () => void
  onSubmit: (event: React.FormEvent) => void
  onTelegramUserIdChange: (value: string) => void
}) {
  return (
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
            onClick={onCopyCommand}
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

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Telegram chat ID
          </label>
          <input
            type="text"
            value={chatId}
            onChange={(event) => onChatIdChange(event.target.value)}
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
            onChange={(event) => onTelegramUserIdChange(event.target.value)}
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
  )
}

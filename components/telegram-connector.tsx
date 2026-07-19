'use client'

import { useState } from 'react'
import { saveTelegramConnection } from '@/app/actions/telegram'
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
    setIsSaving(true)

    try {
      const result = await saveTelegramConnection(chatId, telegramUserId)

      if (!result.success) {
        setError(result.error)
        return
      }

      setIsEditing(false)
      onConnect()
    } catch {
      setError('រក្សាទុកគោលដៅ Telegram មិនបានសម្រេច')
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
              <p className="text-sm font-medium text-foreground">បានរក្សាទុកគោលដៅ Telegram</p>
              <p className="text-xs text-muted-foreground break-all">
                លេខសម្គាល់ឆាត៖ {connection?.telegramChatId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
          >
            {isEditing ? 'បិទ' : 'កែប្រែ'}
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
        <p>បន្ថែមបូតទៅក្នុងឆាតផ្ទាល់ខ្លួន ឬក្រុម រួចផ្ញើ /start ហើយរក្សាទុកលេខសម្គាល់ឆាតនៅទីនេះ។</p>
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
        បើកបូត Telegram
      </Button>

      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">
          ផ្ញើពាក្យបញ្ជានេះក្នុងឆាតគោលដៅ៖
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
            លេខសម្គាល់ឆាត Telegram
          </label>
          <input
            type="text"
            value={chatId}
            onChange={(event) => onChatIdChange(event.target.value)}
            placeholder="លេខសម្គាល់ឆាតឯកជន ឬក្រុម"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSaving}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            លេខសម្គាល់អ្នកប្រើ Telegram
          </label>
          <input
            type="text"
            value={telegramUserId}
            onChange={(event) => onTelegramUserIdChange(event.target.value)}
            placeholder="បំពេញ ឬទុកទំនេរ"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSaving}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកគោលដៅ Telegram'}
        </Button>
      </form>
    </div>
  )
}

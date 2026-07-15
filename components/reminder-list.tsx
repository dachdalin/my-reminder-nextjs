'use client'

import { useState } from 'react'
import { deleteReminder } from '@/app/actions/reminders'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Reminder {
  id: number
  title: string
  description?: string
  scheduledTime: Date
  createdAt: Date
}

interface ReminderListProps {
  reminders: Reminder[]
  onDelete: () => void
}

export default function ReminderList({ reminders, onDelete }: ReminderListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    setDeletingId(id)
    try {
      await deleteReminder(id)
      onDelete()
    } catch (error) {
      console.error('Failed to delete reminder:', error)
      alert('Failed to delete reminder')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isOverdue = (scheduledTime: Date | string) => {
    const d = typeof scheduledTime === 'string' ? new Date(scheduledTime) : scheduledTime
    return d < new Date()
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className={`border rounded-lg transition-all ${
            isOverdue(reminder.scheduledTime)
              ? 'border-destructive/30 bg-destructive/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <button
            onClick={() =>
              setExpandedId(expandedId === reminder.id ? null : reminder.id)
            }
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{reminder.title}</h3>
              <p className="text-sm text-muted-foreground">
                {isOverdue(reminder.scheduledTime) ? '⏰ Overdue: ' : '⏰ '}
                {formatDate(reminder.scheduledTime)}
              </p>
            </div>
            <div className="ml-4 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(reminder.id)
                }}
                disabled={deletingId === reminder.id}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {expandedId === reminder.id ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {expandedId === reminder.id && reminder.description && (
            <div className="border-t border-border px-4 py-3 bg-secondary/10">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {reminder.description}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

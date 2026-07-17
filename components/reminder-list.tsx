'use client'

import { useState } from 'react'
import { deleteReminder } from '@/app/actions/reminders'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Reminder {
  id: number
  title: string
  place: string
  participants: string
  meetingDate: string
  sentAt?: Date | string | null
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
    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isOverdue = (meetingDate: Date | string) => {
    const d = typeof meetingDate === 'string' ? new Date(`${meetingDate}T00:00:00`) : meetingDate
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d < today
  }

  const participantNames = (participants: string) =>
    participants
      .split('\n')
      .map((name) => name.trim())
      .filter(Boolean)

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className={`border rounded-lg transition-all ${
            isOverdue(reminder.meetingDate)
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
                {isOverdue(reminder.meetingDate) ? 'Overdue: ' : ''}
                {formatDate(reminder.meetingDate)}
                {reminder.sentAt ? ' · Sent' : ''}
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

          {expandedId === reminder.id && (
            <div className="border-t border-border px-4 py-3 bg-secondary/10">
              <p className="text-sm text-foreground">
                <span className="font-medium">Place:</span> {reminder.place}
              </p>
              <div className="mt-3">
                <p className="text-sm font-medium text-foreground">Participants</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-foreground">
                  {participantNames(reminder.participants).map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

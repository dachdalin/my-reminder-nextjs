'use client'

import { useState } from 'react'
import { createReminder, updateReminder } from '@/app/actions/reminders'
import { Button } from '@/components/ui/button'

interface Reminder {
  id: number
  title: string
  place: string
  participants: string
  meetingDate: string
}

interface ReminderFormProps {
  onSuccess: () => void
  onCancel?: () => void
  reminder?: Reminder
}

export default function ReminderForm({
  onSuccess,
  onCancel,
  reminder,
}: ReminderFormProps) {
  const [title, setTitle] = useState(reminder?.title ?? '')
  const [place, setPlace] = useState(reminder?.place ?? '')
  const [participants, setParticipants] = useState(reminder?.participants ?? '')
  const [meetingDate, setMeetingDate] = useState(reminder?.meetingDate ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const isEditing = !!reminder

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!place.trim()) {
      setError('Place is required')
      return
    }

    const participantLines = participants
      .split('\n')
      .map((name) => name.trim())
      .filter(Boolean)

    if (participantLines.length === 0) {
      setError('Add at least one participant name')
      return
    }

    if (!meetingDate) {
      setError('Please select a meeting date')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        title: title.trim(),
        place: place.trim(),
        participants: participantLines.join('\n'),
        meetingDate,
      }

      if (reminder) {
        await updateReminder(reminder.id, payload)
      } else {
        await createReminder(payload)
      }

      setTitle('')
      setPlace('')
      setParticipants('')
      setMeetingDate('')
      onSuccess()
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} meeting item. Please try again.`)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Meeting Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ប្រជុំពិភាគក្សា"
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Place</label>
        <input
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="សាលាឃុំ"
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Participants
        </label>
        <textarea
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          placeholder={'សុខ ស៊ា\nទឹម សារ៉ុម'}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-24"
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Put one participant name per line.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Meeting Date</label>
        <input
          type="date"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {isLoading
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
              ? 'Save Changes'
              : 'Create Meeting Item'}
        </Button>
      </div>
    </form>
  )
}

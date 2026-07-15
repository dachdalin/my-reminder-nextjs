'use client'

import { useState } from 'react'
import { createReminder } from '@/app/actions/reminders'
import { Button } from '@/components/ui/button'

interface ReminderFormProps {
  onSuccess: () => void
}

export default function ReminderForm({ onSuccess }: ReminderFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!scheduledTime) {
      setError('Please select a date and time')
      return
    }

    setIsLoading(true)
    try {
      await createReminder({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledTime: new Date(scheduledTime),
      })

      setTitle('')
      setDescription('')
      setScheduledTime('')
      onSuccess()
    } catch (err) {
      setError('Failed to create reminder. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Reminder title"
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-20"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Date & Time</label>
        <input
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {isLoading ? 'Creating...' : 'Create Reminder'}
      </Button>
    </form>
  )
}

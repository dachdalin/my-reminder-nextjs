'use client'

import { useState } from 'react'
import { createReminder, updateReminder } from '@/app/actions/reminders'
import { Button } from '@/components/ui/button'
import DatePickerWithKhmer from './datepicker-kh'

interface Reminder {
  id: number
  title: string
  place: string
  participants: string
  meetingDate: string
  meetingTime?: string | null
}

interface ReminderFormProps {
  onSuccess: () => void
  onCancel?: () => void
  reminder?: Reminder
}

// Build time options: 06:00–22:00 in 30-min steps
const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
function toKhmer(n: number) {
  return n.toString().split('').map((d) => KHMER_DIGITS[Number(d)]).join('')
}
function toKhmerMinute(n: number) {
  return toKhmer(n).padStart(2, '០')
}

function khmerPeriod(h: number) {
  if (h === 0) return 'នាទីអធ្រាត្រ'
  if (h < 12) return 'នាទីព្រឹក'
  if (h === 12) return 'នាទីថ្ងៃត្រង់'
  return 'នាទីរសៀល'
}

function formatOptionLabel(hhmm: string) {
  const [hStr, mStr] = hhmm.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${toKhmer(displayH)}ៈ${toKhmerMinute(m)} ${khmerPeriod(h)}`
}

const TIME_OPTIONS: { value: string; label: string }[] = []
for (let h = 6; h <= 22; h++) {
  for (const m of [0, 30]) {
    if (h === 22 && m === 30) break
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    const value = `${hh}:${mm}`
    TIME_OPTIONS.push({ value, label: formatOptionLabel(value) })
  }
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
  const [meetingTime, setMeetingTime] = useState(reminder?.meetingTime ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const isEditing = !!reminder

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const payload = { title, place, participants, meetingDate, meetingTime: meetingTime || '' }
      const result = reminder
        ? await updateReminder(reminder.id, payload)
        : await createReminder(payload)

      if (!result.success) {
        setError(result.error)
        return
      }

      setTitle('')
      setPlace('')
      setParticipants('')
      setMeetingDate('')
      setMeetingTime('')
      onSuccess()
    } catch {
      setError(
        isEditing
          ? 'កែប្រែកម្មវិធីប្រជុំមិនបានសម្រេច។ សូមព្យាយាមម្តងទៀត។'
          : 'បង្កើតកម្មវិធីប្រជុំមិនបានសម្រេច។ សូមព្យាយាមម្តងទៀត។'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">ចំណងជើងប្រជុំ</label>
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
        <label className="block text-sm font-medium text-foreground mb-2">ទីតាំង</label>
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
          អ្នកត្រូវចូលរួម
        </label>
        <textarea
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          placeholder={'សុខ ស៊ា\nទឹម សារ៉ុម'}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-24"
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          សូមបញ្ចូលឈ្មោះម្នាក់ក្នុងមួយបន្ទាត់។
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <DatePickerWithKhmer
            label="កាលបរិច្ឆេទប្រជុំ"
            value={meetingDate}
            onChange={(value) => setMeetingDate(value)}
            locale="km"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            ម៉ោងប្រជុំ <span className="text-muted-foreground font-normal">(ស្រេចចិត្ត)</span>
          </label>
          <select
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">-- មិនបញ្ជាក់ --</option>
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
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
            បោះបង់
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {isLoading
            ? isEditing
              ? 'កំពុងរក្សាទុក...'
              : 'កំពុងបង្កើត...'
            : isEditing
              ? 'រក្សាទុកការកែប្រែ'
              : 'បង្កើតកម្មវិធីប្រជុំ'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { deleteReminder } from '@/app/actions/reminders'
import ReminderForm from './reminder-form'
import DatePickerWithKhmer from './datepicker-kh'
import ConfirmModal from './confirm-modal'
import type { SelectReminder } from '@/lib/db/schema'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react'

interface ReminderListProps {
  reminders: SelectReminder[]
  onDelete: () => void
  onUpdate: () => void
}

const ITEMS_PER_PAGE = 5

export default function ReminderList({
  reminders,
  onDelete,
  onUpdate,
}: ReminderListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const handleDelete = async () => {
    if (!deleteConfirmId) return

    setDeletingId(deleteConfirmId)
    try {
      const result = await deleteReminder(deleteConfirmId)
      if (result.success) {
        onDelete()
        setDeleteConfirmId(null)
      } else {
        alert(result.error)
      }
    } catch {
      alert('លុបកម្មវិធីប្រជុំមិនបានសម្រេច')
    } finally {
      setDeletingId(null)
    }
  }

  const KHMER_MONTHS = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
  ]

  const toKhmerNumeral = (num: string) =>
    num.replace(/\d/g, (d) => '០១២៣៤៥៦៧៨៩'[Number(d)])

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const day = toKhmerNumeral(String(d.getDate()).padStart(2, '0'))
    const month = KHMER_MONTHS[d.getMonth()]
    const year = toKhmerNumeral(String(d.getFullYear()))
    return `${day} ${month} ${year}`
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

  const filteredReminders = useMemo(() => {
    let result = reminders

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      result = result.filter((reminder) =>
        reminder.title.toLowerCase().includes(query)
      )
    }

    if (dateFilter) {
      result = result.filter((reminder) => reminder.meetingDate === dateFilter)
    }

    return result
  }, [reminders, searchQuery, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filteredReminders.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedReminders = filteredReminders.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleDateChange = (value: string) => {
    setDateFilter(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setDateFilter('')
    setCurrentPage(1)
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const hasActiveFilters = searchQuery.trim() !== '' || dateFilter !== ''

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            ស្វែងរកចំណងជើង
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ស្វែងរក..."
              className="w-full pl-9 pr-9 py-2 border border-input rounded-md bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full sm:w-56">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            កាលបរិច្ឆេទប្រជុំ
          </label>
          <DatePickerWithKhmer
            value={dateFilter}
            onChange={handleDateChange}
            locale="km"
            placeholder="ជ្រើសរើសកាលបរិច្ឆេទ"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            សម្អាត
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          បង្ហាញ {paginatedReminders.length} ក្នុង {filteredReminders.length} លទ្ធផល
          {hasActiveFilters ? ` (សរុប ${reminders.length})` : ''}
        </span>
        {totalPages > 1 && (
          <span>
            ទំព័រ {safePage}/{totalPages}
          </span>
        )}
      </div>

      {paginatedReminders.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg bg-secondary/20">
          <p className="text-muted-foreground text-sm">
            {hasActiveFilters
              ? 'រកមិនឃើញលទ្ធផលដែលត្រូវនឹងតម្រង'
              : 'មិនទាន់មានកម្មវិធីប្រជុំ'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-sm text-primary hover:underline"
            >
              សម្អាតតម្រងទាំងអស់
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedReminders.map((reminder) => (
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
                    {isOverdue(reminder.meetingDate) ? 'ហួសកាលបរិច្ឆេទ៖ ' : ''}
                    {formatDate(reminder.meetingDate)}
                    {reminder.sentAt ? ' · បានផ្ញើ' : ''}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirmId(reminder.id)
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
                  {editingId === reminder.id ? (
                    <ReminderForm
                      reminder={reminder}
                      onCancel={() => setEditingId(null)}
                      onSuccess={() => {
                        setEditingId(null)
                        onUpdate()
                      }}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">ទីតាំង៖</span> {reminder.place}
                        </p>
                        <button
                          type="button"
                          onClick={() => setEditingId(reminder.id)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          កែប្រែ
                        </button>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-foreground">អ្នកត្រូវចូលរួម</p>
                        <ul className="mt-1 list-disc pl-5 text-sm text-foreground">
                          {participantNames(reminder.participants).map((name) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <button
            type="button"
            onClick={() => goToPage(1)}
            disabled={safePage <= 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label="ទំព័រដំបូង"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => goToPage(safePage - 1)}
            disabled={safePage <= 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label="ទំព័រមុន"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors ${
                page === safePage
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => goToPage(safePage + 1)}
            disabled={safePage >= totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label="ទំព័របន្ទាប់"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => goToPage(totalPages)}
            disabled={safePage >= totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label="ទំព័រចុងក្រោយ"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        isLoading={deletingId !== null}
      />
    </div>
  )
}

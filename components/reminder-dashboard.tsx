'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import ReminderForm from './reminder-form'
import ReminderList from './reminder-list'
import TelegramConnector from './telegram-connector'
import { getReminders } from '@/app/actions/reminders'
import { getTelegramConnection } from '@/app/actions/telegram'
import { Bell, CalendarDays, LogOut, Plus, Settings, X } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import SettingsModal from './settings-modal'
import { ThemeToggle } from './theme-toggle'
import type { SelectReminder, SelectTelegramConnection } from '@/lib/db/schema'

export default function ReminderDashboard() {
  const [reminders, setReminders] = useState<SelectReminder[]>([])
  const [telegramConnection, setTelegramConnection] = useState<SelectTelegramConnection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [remindersResult, telegramResult] = await Promise.all([
        getReminders(),
        getTelegramConnection(),
      ])
      if (remindersResult.success) setReminders(remindersResult.data)
      if (telegramResult.success) setTelegramConnection(telegramResult.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [])

  const handleLogout = async () => {
    await authClient.signOut()
    window.location.href = '/sign-in'
  }

  const upcomingCount = reminders.filter((r) => {
    const d = new Date(`${r.meetingDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d >= today
  }).length

  const sentCount = reminders.filter((r) => r.sentAt).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 transition-colors duration-300">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
              <Bell className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground leading-none truncate">
                ជូនដំណឹងប្រជុំ
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                គ្រប់គ្រងកាលវិភាគប្រជុំ
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="ការកំណត់"
              aria-label="ការកំណត់"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-destructive"
              title="ចាកចេញ"
              aria-label="ចាកចេញ"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ── Stats strip ──────────────────────────────────────────── */}
        {!isLoading && reminders.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'កម្មវិធីទាំងអស់', value: reminders.length, color: 'text-primary' },
              { label: 'នាំខាងមុខ', value: upcomingCount, color: 'text-emerald-500' },
              { label: 'បានផ្ញើ', value: sentCount, color: 'text-sky-500' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm px-4 py-3 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Main grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Add meeting card */}
            <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {showForm ? 'បំពេញព័ត៌មាន' : 'បន្ថែមប្រជុំ'}
                  </h2>
                </div>
                {showForm && (
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    aria-label="បិទ"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="p-5">
                {showForm ? (
                  <ReminderForm
                    onSuccess={() => {
                      setShowForm(false)
                      loadData()
                    }}
                  />
                ) : (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20"
                  >
                    <Plus className="w-4 h-4" />
                    បន្ថែមកម្មវិធីប្រជុំ
                  </Button>
                )}
              </div>
            </div>

            {/* Telegram card */}
            <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <span className="text-sm">✈️</span>
                </div>
                <h2 className="text-sm font-semibold text-foreground">គោលដៅ Telegram</h2>
              </div>
              <div className="p-5">
                <TelegramConnector
                  key={telegramConnection?.id ?? 'new-telegram-target'}
                  isConnected={!!telegramConnection}
                  connection={telegramConnection}
                  onConnect={() => loadData()}
                />
              </div>
            </div>
          </div>

          {/* Main content – reminder list */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">កាលវិភាគប្រជុំ</h2>
                {!isLoading && (
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {reminders.length} កម្មវិធី
                  </span>
                )}
              </div>

              <div className="p-5">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">កំពុងផ្ទុក...</p>
                  </div>
                ) : reminders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                      <CalendarDays className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">មិនទាន់មានកម្មវិធីប្រជុំ</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ចុចប៊ូតុង <span className="font-semibold text-primary">«បន្ថែមកម្មវិធីប្រជុំ»</span> ដើម្បីចាប់ផ្តើម
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowForm(true)}
                      size="sm"
                      className="mt-1 gap-1.5 bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      បន្ថែមកម្មវិធីប្រជុំ
                    </Button>
                  </div>
                ) : (
                  <ReminderList
                    reminders={reminders}
                    onDelete={loadData}
                    onUpdate={loadData}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

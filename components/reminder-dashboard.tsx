'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import ReminderForm from './reminder-form'
import ReminderList from './reminder-list'
import TelegramConnector from './telegram-connector'
import { getReminders } from '@/app/actions/reminders'
import { getTelegramConnection } from '@/app/actions/telegram'
import {
  Bell,
  CalendarClock,
  CalendarDays,
  LayoutList,
  LogOut,
  Plus,
  SendHorizonal,
  Settings,
  X,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import SettingsModal from './settings-modal'
import { ThemeToggle } from './theme-toggle'
import type { SelectReminder, SelectTelegramConnection } from '@/lib/db/schema'

/** Animates a number from 0 → target over `duration` ms with easeOut. */
function useCountUp(target: number, duration = 700) {
  const [count, setCount] = useState(0)
  const prevTarget = useRef<number>(0)

  useEffect(() => {
    if (target === prevTarget.current) return
    prevTarget.current = target

    const start = performance.now()
    const from = 0

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(from + (target - from) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [target, duration])

  return count
}

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
        <StatsStrip
          total={reminders.length}
          upcoming={upcomingCount}
          sent={sentCount}
          visible={!isLoading && reminders.length > 0}
        />

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

// ─── StatsStrip ──────────────────────────────────────────────────────────────

interface StatsStripProps {
  total: number
  upcoming: number
  sent: number
  visible: boolean
}

interface StatCardProps {
  label: string
  sublabel: string
  target: number
  icon: React.ReactNode
  iconBg: string
  valueColor: string
  accentBorder: string
  delay: number
  visible: boolean
}

function StatCard({
  label,
  sublabel,
  target,
  icon,
  iconBg,
  valueColor,
  accentBorder,
  delay,
  visible,
}: StatCardProps) {
  const count = useCountUp(visible ? target : 0, 800)

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 group"
      style={{
        animation: visible ? `fadeSlideUp 0.5s ease both ${delay}ms` : 'none',
      }}
    >
      {/* Accent bottom border */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${accentBorder} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="px-4 py-4 flex items-center gap-3">
        {/* Icon pill */}
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className={`text-2xl font-bold tabular-nums tracking-tight ${valueColor} leading-none`}>
            {count}
          </p>
          <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{sublabel}</p>
        </div>
      </div>

      {/* Subtle shimmer bg on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/5 to-transparent dark:from-white/3" />
    </div>
  )
}

function StatsStrip({ total, upcoming, sent, visible }: StatsStripProps) {
  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className={`grid grid-cols-3 gap-3 mb-6 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <StatCard
          label="កម្មវិធីទាំងអស់"
          sublabel="រួបរួមសរុប"
          target={total}
          icon={<LayoutList className="w-5 h-5 text-primary" />}
          iconBg="bg-primary/10 dark:bg-primary/20"
          valueColor="text-primary"
          accentBorder="bg-primary"
          delay={0}
          visible={visible}
        />
        <StatCard
          label="នាំខាងមុខ"
          sublabel="ថ្ងៃនេះ – ខាងមុខ"
          target={upcoming}
          icon={<CalendarClock className="w-5 h-5 text-emerald-500" />}
          iconBg="bg-emerald-500/10 dark:bg-emerald-500/20"
          valueColor="text-emerald-500"
          accentBorder="bg-emerald-500"
          delay={80}
          visible={visible}
        />
        <StatCard
          label="បានផ្ញើ"
          sublabel="ជូនដំណឹងរួចហើយ"
          target={sent}
          icon={<SendHorizonal className="w-5 h-5 text-sky-500" />}
          iconBg="bg-sky-500/10 dark:bg-sky-500/20"
          valueColor="text-sky-500"
          accentBorder="bg-sky-500"
          delay={160}
          visible={visible}
        />
      </div>
    </>
  )
}

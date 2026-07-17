'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import ReminderForm from './reminder-form'
import ReminderList from './reminder-list'
import TelegramConnector from './telegram-connector'
import { getReminders, getTelegramConnection } from '@/app/actions/reminders'
import { LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

interface Reminder {
  id: number
  userId: string
  title: string
  place: string
  participants: string
  meetingDate: string
  sentAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

interface TelegramConn {
  id: number
  userId: string
  telegramChatId: string
  telegramUserId?: string
  createdAt: Date
}

export default function ReminderDashboard() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [telegramConnection, setTelegramConnection] = useState<TelegramConn | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [remindersData, telegramData] = await Promise.all([
        getReminders(),
        getTelegramConnection(),
      ])
      setReminders(remindersData as Reminder[])
      setTelegramConnection(telegramData as TelegramConn | null)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial server-action load for the client dashboard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [])

  const handleLogout = async () => {
    await authClient.signOut()
    window.location.href = '/sign-in'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/30 dark:to-blue-950/10">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">⏰</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Meeting Reminders</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form and Telegram */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create Reminder Card */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">New Meeting Item</h2>
                {showForm && (
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>
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
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Add Meeting Item
                </Button>
              )}
            </div>

            {/* Telegram Connection Card */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-foreground mb-4">Telegram Target</h2>
              <TelegramConnector
                isConnected={!!telegramConnection}
                onConnect={() => loadData()}
              />
            </div>
          </div>

          {/* Right Column - Reminders List */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-6">Meeting Schedule</h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-2">No meeting items yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add agenda rows for each meeting date to get started
                  </p>
                </div>
              ) : (
                <ReminderList reminders={reminders} onDelete={loadData} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

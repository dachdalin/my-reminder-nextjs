'use client'

import { useState, useEffect } from 'react'
import { authClient, useSession } from '@/lib/auth-client'
import { updatePersonalInfo } from '@/app/actions/reminders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { User, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data: session, refetch } = useSession()
  
  // Tabs: 'profile' | 'password'
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

  // Profile Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Populate profile fields when session is loaded
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? '')
      setEmail(session.user.email ?? '')
    }
  }, [session])

  if (!isOpen) return null

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMessage(null)
    setProfileLoading(true)

    try {
      await updatePersonalInfo({ name, email })
      await refetch()
      setProfileMessage({ type: 'success', text: 'ព័ត៌មានផ្ទាល់ខ្លួនត្រូវបានរក្សាទុកដោយជោគជ័យ។' })
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.message === 'Email is already taken' ? 'អ៊ីមែលនេះមានគណនីផ្សេងប្រើប្រាស់រួចហើយ។' : 'មានកំហុសក្នុងការរក្សាទុកព័ត៌មាន។',
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៨ ខ្ទង់។' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'ពាក្យសម្ងាត់ថ្មី និងការបញ្ជាក់ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ។' })
      return
    }

    setPasswordLoading(true)

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })

    setPasswordLoading(false)

    if (error) {
      setPasswordMessage({
        type: 'error',
        text: error.message ?? 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ។',
      })
    } else {
      setPasswordMessage({ type: 'success', text: 'ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ។' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-bold text-foreground">ការកំណត់គណនី</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Tabs navigation */}
        <div className="flex border-b border-border bg-muted/30 p-1 m-4 rounded-lg">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'profile'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4" />
            ព័ត៌មានគណនី
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'password'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Lock className="w-4 h-4" />
            សុវត្ថិភាព
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-2">
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-name" className="text-sm font-medium">ឈ្មោះ</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="settings-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    placeholder="ឈ្មោះរបស់អ្នក"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-email" className="text-sm font-medium">អ៊ីមែល</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="settings-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="អ៊ីមែលរបស់អ្នក"
                    required
                  />
                </div>
              </div>

              {profileMessage && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    profileMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-destructive/10 text-destructive border border-destructive/20'
                  }`}
                >
                  {profileMessage.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={profileLoading}
                className="w-full bg-primary hover:bg-primary/90 mt-2"
              >
                {profileLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    កំពុងរក្សាទុក...
                  </>
                ) : (
                  'រក្សាទុកព័ត៌មាន'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-current-password">ពាក្យសម្ងាត់បច្ចុប្បន្ន</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="settings-current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-new-password">ពាក្យសម្ងាត់ថ្មី</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="settings-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="•••••••• (យ៉ាងហោចណាស់ ៨ ខ្ទង់)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-confirm-password">បញ្ជាក់ពាក្យសម្ងាត់ថ្មី</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="settings-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {passwordMessage && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    passwordMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-destructive/10 text-destructive border border-destructive/20'
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-primary hover:bg-primary/90 mt-2"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    កំពុងប្តូរ...
                  </>
                ) : (
                  'ប្តូរពាក្យសម្ងាត់'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

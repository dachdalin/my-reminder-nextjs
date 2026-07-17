'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'មានបញ្ហាកើតឡើង')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isSignUp ? 'បង្កើតគណនី' : 'សូមស្វាគមន៍មកវិញ'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp
              ? 'ចុះឈ្មោះដើម្បីចាប់ផ្តើមប្រើប្រាស់'
              : 'ចូលគណនីរបស់អ្នកដើម្បីបន្ត'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">ឈ្មោះ</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">អ៊ីមែល</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">ពាក្យសម្ងាត់</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? 'សូមរង់ចាំ...'
              : isSignUp
                ? 'បង្កើតគណនី'
                : 'ចូលគណនី'}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isSignUp ? 'មានគណនីរួចហើយ? ' : 'មិនទាន់មានគណនី? '}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? 'ចូលគណនី' : 'ចុះឈ្មោះ'}
          </Link>
        </p>
      </Card>
    </main>
  )
}

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import ReminderDashboard from '@/components/reminder-dashboard'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  return <ReminderDashboard />
}
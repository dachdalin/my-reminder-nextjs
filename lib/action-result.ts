import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

export function fail<T = never>(error: string): ActionResult<T> {
  return { success: false, error }
}

export async function getAuthUserId(): Promise<ActionResult<string>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user?.id) {
      return fail('Unauthorized')
    }

    return ok(session.user.id)
  } catch {
    return fail('Unauthorized')
  }
}

export async function withAuth<T>(
  action: (userId: string) => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  const authResult = await getAuthUserId()

  if (!authResult.success) {
    return authResult
  }

  try {
    return await action(authResult.data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    console.error('[Action Error]', message)
    return fail(message)
  }
}

'use server'

import { db } from '@/lib/db'
import { reminders } from '@/lib/db/schema'
import type { SelectReminder } from '@/lib/db/schema'
import { withAuth, ok, fail, type ActionResult } from '@/lib/action-result'
import { validateCreateReminder, validateUpdateReminder } from '@/lib/validation'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getReminders(): Promise<ActionResult<SelectReminder[]>> {
  return withAuth(async (userId) => {
    const rows = await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId))
      .orderBy(desc(reminders.meetingDate), desc(reminders.createdAt))

    return ok(rows)
  })
}

export async function createReminder(
  data: Record<string, unknown>
): Promise<ActionResult<SelectReminder>> {
  return withAuth(async (userId) => {
    const validated = validateCreateReminder(data)
    if (!validated.success) return validated

    const result = await db
      .insert(reminders)
      .values({ userId, ...validated.data })
      .returning()

    revalidatePath('/')
    return ok(result[0])
  })
}

export async function updateReminder(
  id: number,
  data: Record<string, unknown>
): Promise<ActionResult<SelectReminder>> {
  return withAuth(async (userId) => {
    const validated = validateUpdateReminder(data)
    if (!validated.success) return validated

    const result = await db
      .update(reminders)
      .set({ ...validated.data, sentAt: null, updatedAt: new Date() })
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
      .returning()

    if (result.length === 0) return fail('រកមិនឃើញកម្មវិធីប្រជុំ')

    revalidatePath('/')
    return ok(result[0])
  })
}

export async function deleteReminder(
  id: number
): Promise<ActionResult<null>> {
  return withAuth(async (userId) => {
    const result = await db
      .delete(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
      .returning({ id: reminders.id })

    if (result.length === 0) return fail('រកមិនឃើញកម្មវិធីប្រជុំ')

    revalidatePath('/')
    return ok(null)
  })
}

'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import type { SelectUser } from '@/lib/db/schema'
import { withAuth, ok, fail, type ActionResult } from '@/lib/action-result'
import { validatePersonalInfo } from '@/lib/validation'
import { and, eq, ne } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function updatePersonalInfo(
  data: Record<string, unknown>
): Promise<ActionResult<SelectUser>> {
  return withAuth(async (userId) => {
    const validated = validatePersonalInfo(data)
    if (!validated.success) return validated

    const duplicate = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.email, validated.data.email), ne(user.id, userId)))
      .limit(1)

    if (duplicate.length > 0) return fail('អុីម៉ែលនេះត្រូវបានប្រើរួចហើយ')

    const result = await db
      .update(user)
      .set({
        name: validated.data.name,
        email: validated.data.email,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning()

    if (result.length === 0) return fail('រកមិនឃើញអ្នកប្រើ')

    revalidatePath('/')
    return ok(result[0])
  })
}

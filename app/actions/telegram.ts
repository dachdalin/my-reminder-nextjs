'use server'

import { db } from '@/lib/db'
import { telegramConnection } from '@/lib/db/schema'
import type { SelectTelegramConnection } from '@/lib/db/schema'
import { withAuth, ok, type ActionResult } from '@/lib/action-result'
import { validateTelegramConnection } from '@/lib/validation'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getTelegramConnection(): Promise<ActionResult<SelectTelegramConnection | null>> {
  return withAuth(async (userId) => {
    const result = await db
      .select()
      .from(telegramConnection)
      .where(eq(telegramConnection.userId, userId))
      .limit(1)

    return ok(result[0] ?? null)
  })
}

export async function saveTelegramConnection(
  chatId: unknown,
  telegramUserId: unknown
): Promise<ActionResult<null>> {
  return withAuth(async (userId) => {
    const validated = validateTelegramConnection(chatId, telegramUserId)
    if (!validated.success) return validated

    const existing = await db
      .select({ id: telegramConnection.id })
      .from(telegramConnection)
      .where(eq(telegramConnection.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(telegramConnection)
        .set({
          telegramChatId: validated.data.chatId,
          telegramUserId: validated.data.userId,
        })
        .where(eq(telegramConnection.userId, userId))
    } else {
      await db.insert(telegramConnection).values({
        userId,
        telegramChatId: validated.data.chatId,
        telegramUserId: validated.data.userId,
      })
    }

    revalidatePath('/')
    return ok(null)
  })
}

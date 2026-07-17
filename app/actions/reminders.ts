'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reminders, telegramConnection } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getReminders() {
  const userId = await getUserId()
  return db
    .select()
    .from(reminders)
    .where(eq(reminders.userId, userId))
    .orderBy(desc(reminders.meetingDate), desc(reminders.createdAt))
}

export async function createReminder(data: {
  title: string
  place: string
  participants: string
  meetingDate: string
}) {
  const userId = await getUserId()
  const result = await db
    .insert(reminders)
    .values({
      userId,
      ...data,
    })
    .returning()
  revalidatePath('/')
  return result[0]
}

export async function updateReminder(
  id: number,
  data: {
    title?: string
    place?: string
    participants?: string
    meetingDate?: string
  }
) {
  const userId = await getUserId()
  const result = await db
    .update(reminders)
    .set(data)
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
    .returning()
  revalidatePath('/')
  return result[0]
}

export async function deleteReminder(id: number) {
  const userId = await getUserId()
  await db
    .delete(reminders)
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
  revalidatePath('/')
}

export async function getTelegramConnection() {
  const userId = await getUserId()
  const result = await db
    .select()
    .from(telegramConnection)
    .where(eq(telegramConnection.userId, userId))
    .limit(1)
  return result[0] || null
}

export async function saveTelegramConnection(chatId: string, userId: string) {
  const currentUserId = await getUserId()
  const existing = await db
    .select()
    .from(telegramConnection)
    .where(eq(telegramConnection.userId, currentUserId))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(telegramConnection)
      .set({ telegramChatId: chatId, telegramUserId: userId })
      .where(eq(telegramConnection.userId, currentUserId))
  } else {
    await db.insert(telegramConnection).values({
      userId: currentUserId,
      telegramChatId: chatId,
      telegramUserId: userId,
    })
  }
  revalidatePath('/')
}

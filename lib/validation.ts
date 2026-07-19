import { fail, ok, type ActionResult } from './action-result'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidDateString(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export interface CreateReminderInput {
  title: string
  place: string
  participants: string
  meetingDate: string
}

export function validateCreateReminder(
  data: Record<string, unknown>
): ActionResult<CreateReminderInput> {
  const title = String(data.title ?? '').trim()
  const place = String(data.place ?? '').trim()
  const participants = String(data.participants ?? '').trim()
  const meetingDate = String(data.meetingDate ?? '').trim()

  if (!title) return fail('សូមបញ្ចូលចំណងជើងប្រជុំ')
  if (!place) return fail('សូមបញ្ចូលទីតាំង')
  if (!participants) return fail('សូមបញ្ចូលឈ្មោះអ្នកចូលរួមយ៉ាងហោចណាស់ម្នាក់')
  if (!meetingDate || !isValidDateString(meetingDate)) {
    return fail('កាលបរិច្ឆេទមិនត្រឹមត្រូវ')
  }

  return ok({ title, place, participants, meetingDate })
}

export interface UpdateReminderInput {
  title?: string
  place?: string
  participants?: string
  meetingDate?: string
}

export function validateUpdateReminder(
  data: Record<string, unknown>
): ActionResult<UpdateReminderInput> {
  const result: UpdateReminderInput = {}
  let hasField = false

  if (data.title !== undefined) {
    const title = String(data.title).trim()
    if (!title) return fail('ចំណងជើងមិនអាចទទេបានទេ')
    result.title = title
    hasField = true
  }

  if (data.place !== undefined) {
    const place = String(data.place).trim()
    if (!place) return fail('ទីតាំងមិនអាចទទេបានទេ')
    result.place = place
    hasField = true
  }

  if (data.participants !== undefined) {
    const participants = String(data.participants).trim()
    if (!participants) return fail('អ្នកចូលរួមមិនអាចទទេបានទេ')
    result.participants = participants
    hasField = true
  }

  if (data.meetingDate !== undefined) {
    const meetingDate = String(data.meetingDate).trim()
    if (!meetingDate || !isValidDateString(meetingDate)) {
      return fail('កាលបរិច្ឆេទមិនត្រឹមត្រូវ')
    }
    result.meetingDate = meetingDate
    hasField = true
  }

  if (!hasField) return fail('គ្មានទិន្នន័យត្រូវកែប្រែ')

  return ok(result)
}

export interface TelegramConnectionInput {
  chatId: string
  userId: string
}

export function validateTelegramConnection(
  chatId: unknown,
  userId: unknown
): ActionResult<TelegramConnectionInput> {
  const trimmedChatId = String(chatId ?? '').trim()
  const trimmedUserId = String(userId ?? '').trim()

  if (!trimmedChatId) return fail('សូមបញ្ចូល Chat ID របស់ Telegram')

  return ok({ chatId: trimmedChatId, userId: trimmedUserId })
}

export interface PersonalInfoInput {
  name: string
  email: string
}

export function validatePersonalInfo(
  data: Record<string, unknown>
): ActionResult<PersonalInfoInput> {
  const name = String(data.name ?? '').trim()
  const email = String(data.email ?? '').trim()

  if (!name) return fail('សូមបញ្ចូលឈ្មោះ')
  if (!email || !EMAIL_REGEX.test(email)) return fail('អុីម៉ែលមិនត្រឹមត្រូវ')

  return ok({ name, email })
}

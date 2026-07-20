import { relations } from 'drizzle-orm'
import { boolean, date, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  place: text('place').notNull(),
  participants: text('participants').notNull(),
  meetingDate: date('meetingDate').notNull(),
  meetingTime: text('meetingTime'),
  sentAt: timestamp('sentAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const telegramConnection = pgTable('telegramConnection', {
  id: serial('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  telegramChatId: text('telegramChatId').notNull(),
  telegramUserId: text('telegramUserId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  reminders: many(reminders),
  telegramConnections: many(telegramConnection),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const reminderRelations = relations(reminders, ({ one }) => ({
  user: one(user, { fields: [reminders.userId], references: [user.id] }),
}))

export const telegramConnectionRelations = relations(telegramConnection, ({ one }) => ({
  user: one(user, { fields: [telegramConnection.userId], references: [user.id] }),
}))

export type SelectUser = typeof user.$inferSelect
export type InsertUser = typeof user.$inferInsert
export type SelectReminder = typeof reminders.$inferSelect
export type InsertReminder = typeof reminders.$inferInsert
export type SelectTelegramConnection = typeof telegramConnection.$inferSelect
export type InsertTelegramConnection = typeof telegramConnection.$inferInsert

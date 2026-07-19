import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'
import { createAuthMiddleware, APIError } from 'better-auth/api'

const authSecret = process.env.BETTER_AUTH_SECRET
const authUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

if (!authSecret) {
  throw new Error('BETTER_AUTH_SECRET is required')
}

export const auth = betterAuth({
  database: pool,
  secret: authSecret,
  baseURL: authUrl,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith('/sign-up')) {
        throw new APIError('BAD_REQUEST', {
          message: 'Sign-up is currently disabled.',
        })
      }
    }),
  },
})

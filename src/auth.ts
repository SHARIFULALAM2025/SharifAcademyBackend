import { betterAuth } from 'better-auth'
import { kyselyAdapter } from '@better-auth/kysely-adapter'
import { db } from './db'

export const auth = betterAuth({
  database: kyselyAdapter(db),

  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',

  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: [process.env.Frontend_AUTH_URL || 'http://localhost:3000'],
})

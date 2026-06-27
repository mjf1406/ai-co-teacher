import Google from '@auth/core/providers/google'
import { convexAuth } from '@convex-dev/auth/server'

import { isAllowedEmail } from './lib/auth'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const email = args.profile.email
      if (!isAllowedEmail(email)) {
        throw new Error('Unauthorized')
      }

      if (args.existingUserId !== null) {
        return args.existingUserId
      }

      return ctx.db.insert('users', {
        name: args.profile.name,
        email: email!,
        image: args.profile.image,
        emailVerificationTime: Date.now(),
      })
    },
  },
})

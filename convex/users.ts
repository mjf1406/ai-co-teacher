import { query } from './_generated/server'
import { getCurrentUser } from './lib/auth'

export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return null

    return {
      email: user.email,
      name: user.name,
      image: user.image,
    }
  },
})

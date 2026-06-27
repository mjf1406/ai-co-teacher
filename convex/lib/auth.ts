import { getAuthUserId } from '@convex-dev/auth/server'

import { internalQuery } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

export const ALLOWED_EMAIL = 'michael.fitzgerald.1406@gmail.com'

export function isAllowedEmail(email: string | undefined | null): boolean {
  return email?.toLowerCase() === ALLOWED_EMAIL.toLowerCase()
}

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'users'> | null> {
  const userId = await getAuthUserId(ctx)
  if (!userId) return null

  const user = await ctx.db.get(userId)
  if (!user || !isAllowedEmail(user.email)) return null

  return user
}

export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'users'>> {
  const user = await getCurrentUser(ctx)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<'users'>> {
  const user = await requireUser(ctx)
  return user._id
}

export const requireUserQuery = internalQuery({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    return true
  },
})

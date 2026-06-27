import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireUserId } from './lib/auth'

export const listLibrary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    const clips = await ctx.db
      .query('voiceClips')
      .withIndex('by_user_type_label', (q) => q.eq('userId', userId))
      .collect()

    const libraryClips = clips.filter((clip) => !clip.dictationId)

    return Promise.all(
      libraryClips.map(async (clip) => ({
        ...clip,
        audioUrl: await ctx.storage.getUrl(clip.storageId),
      })),
    )
  },
})

export const save = mutation({
  args: {
    type: v.union(v.literal('number'), v.literal('ordinal'), v.literal('word')),
    label: v.string(),
    storageId: v.id('_storage'),
    dictationId: v.optional(v.id('dictations')),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)

    const existing = await ctx.db
      .query('voiceClips')
      .withIndex('by_user_type_label', (q) =>
        q.eq('userId', userId).eq('type', args.type).eq('label', args.label),
      )
      .collect()

    const match = existing.find((clip) => clip.dictationId === args.dictationId)

    if (match) {
      await ctx.storage.delete(match.storageId)
      await ctx.db.patch(match._id, { storageId: args.storageId })
      return match._id
    }

    return await ctx.db.insert('voiceClips', {
      userId,
      type: args.type,
      label: args.label,
      storageId: args.storageId,
      dictationId: args.dictationId,
    })
  },
})

export const remove = mutation({
  args: { id: v.id('voiceClips') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const clip = await ctx.db.get(args.id)
    if (!clip || clip.userId !== userId) {
      throw new Error('Clip not found')
    }
    await ctx.storage.delete(clip.storageId)
    await ctx.db.delete(args.id)
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

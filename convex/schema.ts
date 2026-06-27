import { defineSchema, defineTable } from 'convex/server'
import { authTables } from '@convex-dev/auth/server'
import { v } from 'convex/values'

const dictationSettings = v.object({
  words: v.array(v.string()),
  repeatsPerWord: v.number(),
  silenceBetweenWordsMs: v.number(),
  announceNumbers: v.boolean(),
  silenceBetweenNumbersMs: v.number(),
  silenceBetweenWordGroupsMs: v.optional(v.number()),
  voiceSource: v.union(v.literal('ai'), v.literal('own')),
  voiceId: v.optional(v.string()),
  accent: v.optional(v.string()),
  aiWordRepeatMode: v.optional(
    v.union(v.literal('synthesize_once'), v.literal('synthesize_each')),
  ),
})

const schema = defineSchema({
  ...authTables,

  dictations: defineTable({
    userId: v.id('users'),
    name: v.string(),
    createdAt: v.number(),
    storageId: v.id('_storage'),
    settings: dictationSettings,
  }).index('by_user_createdAt', ['userId', 'createdAt']),

  voiceClips: defineTable({
    userId: v.id('users'),
    type: v.union(v.literal('number'), v.literal('ordinal'), v.literal('word')),
    label: v.string(),
    storageId: v.id('_storage'),
    dictationId: v.optional(v.id('dictations')),
  })
    .index('by_user_type_label', ['userId', 'type', 'label'])
    .index('by_dictation', ['dictationId']),
})

export default schema

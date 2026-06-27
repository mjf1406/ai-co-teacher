import { v } from 'convex/values'

import { action } from './_generated/server'
import { internal } from './_generated/api'

const FLASH_TURBO_MODEL_IDS = new Set([
  'eleven_flash_v2_5',
  'eleven_flash_v2',
  'eleven_turbo_v2_5',
  'eleven_turbo_v2',
])

const DEFAULT_TTS_MODEL = 'eleven_flash_v2_5'

export const listEnglishVoices = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runQuery(internal.lib.auth.requireUserQuery)

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not configured')
    }

    const response = await fetch('https://api.elevenlabs.io/v2/voices?page_size=100', {
      headers: { 'xi-api-key': apiKey },
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const data = (await response.json()) as {
      voices: Array<{
        voice_id: string
        name: string
        preview_url: string | null
        verified_languages?: Array<{
          language: string
          model_id: string
          accent: string | null
          preview_url: string | null
        }>
      }>
    }

    const accentMap = new Map<
      string,
      Array<{ voiceId: string; name: string; previewUrl: string | null }>
    >()

    for (const voice of data.voices) {
      const english =
        voice.verified_languages?.filter(
          (lang) => lang.language === 'en' && FLASH_TURBO_MODEL_IDS.has(lang.model_id),
        ) ?? []
      if (english.length === 0) continue

      for (const lang of english) {
        const accent = lang.accent ?? 'english'
        const accentKey = accent.toLowerCase()
        const voices = accentMap.get(accentKey) ?? []
        if (voices.some((entry) => entry.voiceId === voice.voice_id)) continue
        voices.push({
          voiceId: voice.voice_id,
          name: voice.name,
          previewUrl: lang.preview_url ?? voice.preview_url,
        })
        accentMap.set(accentKey, voices)
      }
    }

    return Array.from(accentMap.entries())
      .map(([accent, voices]) => ({ accent, voices }))
      .sort((a, b) => a.accent.localeCompare(b.accent))
  },
})

export const synthesizeSpeech = action({
  args: {
    voiceId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.lib.auth.requireUserQuery)

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not configured')
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${args.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: args.text,
          model_id: DEFAULT_TTS_MODEL,
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS error: ${response.status}`)
    }

    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    return btoa(binary)
  },
})

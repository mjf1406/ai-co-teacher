export type AiWordRepeatMode = 'synthesize_once' | 'synthesize_each'

export type DictationSettings = {
  words: string[]
  repeatsPerWord: number
  silenceBetweenWordsMs: number
  announceNumbers: boolean
  silenceBetweenNumbersMs: number
  silenceBetweenWordGroupsMs?: number
  voiceSource: 'ai' | 'own'
  voiceId?: string
  accent?: string
  aiWordRepeatMode?: AiWordRepeatMode
  speechSpeed?: number
}

export type AudioSegment = {
  blob: Blob
  silenceAfterMs: number
}

export const DEFAULT_SETTINGS: Omit<DictationSettings, 'words'> = {
  repeatsPerWord: 2,
  silenceBetweenWordsMs: 3000,
  announceNumbers: true,
  silenceBetweenNumbersMs: 1500,
  silenceBetweenWordGroupsMs: 5000,
  voiceSource: 'ai',
  aiWordRepeatMode: 'synthesize_once',
  speechSpeed: 1.0,
}

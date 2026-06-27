export const VOICE_SAMPLE_INTRO = 'This is a sample'

export const LADDER_VERSION = 1

export const VOICE_SAMPLE_LADDER = [
  { syllables: 1, word: 'cat' },
  { syllables: 2, word: 'table' },
  { syllables: 3, word: 'banana' },
  { syllables: 4, word: 'computer' },
  { syllables: 5, word: 'education' },
  { syllables: 6, word: 'university' },
  { syllables: 7, word: 'understanding' },
  { syllables: 8, word: 'incomprehensibility' },
  { syllables: 9, word: 'internationalization' },
  { syllables: 10, word: 'disestablishmentarianism' },
] as const

export const CACHED_PREVIEW_SPEEDS = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2] as const

function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function buildVoiceSampleText(): string {
  const words = VOICE_SAMPLE_LADDER.map((entry) => capitalizeWord(entry.word))
  return `${VOICE_SAMPLE_INTRO}. ${words.join('. ')}.`
}

export function quantizeSpeed(speed: number): number {
  const clamped = Math.min(1.2, Math.max(0.7, speed))
  return Math.round(clamped * 10) / 10
}

export function formatVoiceSampleDescription(speed: number): string {
  const quantized = quantizeSpeed(speed)
  const wordList = VOICE_SAMPLE_LADDER.map(
    (entry) => `${entry.word} (${entry.syllables})`,
  ).join(', ')

  return `Cached preview at ${quantized.toFixed(1)}x speed. The recording says "${VOICE_SAMPLE_INTRO}", then one word per syllable count: ${wordList}. Your dictation will use this voice and speed for each word.`
}

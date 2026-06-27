const ORDINALS = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
] as const

export function toOrdinalWord(index: number): string {
  if (index < 1 || index > ORDINALS.length) {
    throw new Error(`Index ${index} is out of range for ordinals`)
  }
  return ORDINALS[index - 1]!
}

export function numberAnnouncement(index: number): string {
  return `Number ${toOrdinalWord(index)}`
}

export const ORDINAL_WORDS = ORDINALS

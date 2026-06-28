export type WordSearchCase = 'upper' | 'lower' | 'mixed'

export type WordSearchDirections = {
  horizontal: boolean
  vertical: boolean
  diagonal: boolean
  backwards: boolean
}

export type WordSearchSettings = {
  width: number
  height: number
  letterCase: WordSearchCase
  directions: WordSearchDirections
}

export const WORD_SEARCH_MIN_SIZE = 5
export const WORD_SEARCH_MAX_SIZE = 25

export const DEFAULT_WORD_SEARCH_SETTINGS: WordSearchSettings = {
  width: 12,
  height: 12,
  letterCase: 'upper',
  directions: {
    horizontal: true,
    vertical: true,
    diagonal: true,
    backwards: true,
  },
}

export type WordSearchPlacement = {
  word: string
  row: number
  col: number
  dr: number
  dc: number
}

export type WordSearchResult = {
  grid: string[][]
  placements: WordSearchPlacement[]
  unplaced: string[]
}

export const WORD_SEARCH_CASE_OPTIONS: Array<{
  value: WordSearchCase
  label: string
}> = [
  { value: 'upper', label: 'Uppercase' },
  { value: 'lower', label: 'Lowercase' },
  { value: 'mixed', label: 'Mixed case' },
]

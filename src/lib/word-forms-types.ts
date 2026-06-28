import type { GradeLevel } from '@/lib/differentiation-types'
import { formatGradeLabel } from '@/lib/differentiation-types'

export type WordFormItem = {
  label: string
  form: string
}

export type WordFormEntry = {
  id: string
  baseWord: string
  forms: WordFormItem[]
  source: 'ai' | 'manual'
}

export type WordFormSentence = {
  id: string
  baseWord: string
  form: string
  label: string
  gradeLevel: GradeLevel
  sentence: string
  source: 'ai' | 'manual'
}

export function createWordFormId(): string {
  return crypto.randomUUID()
}

export function createWordFormSentenceId(): string {
  return crypto.randomUUID()
}

export function createManualWordFormEntry(input: {
  baseWord: string
  forms?: WordFormItem[]
}): WordFormEntry {
  return {
    id: createWordFormId(),
    baseWord: input.baseWord,
    forms: input.forms ?? [{ label: 'Form', form: '' }],
    source: 'manual',
  }
}

export function createAiWordFormEntry(input: {
  baseWord: string
  forms: WordFormItem[]
}): WordFormEntry {
  return {
    id: createWordFormId(),
    baseWord: input.baseWord,
    forms: input.forms,
    source: 'ai',
  }
}

export function wordFormSentenceHeading(
  gradeLevel: GradeLevel,
  count: number,
): string {
  return `${formatGradeLabel(gradeLevel)} — ${count} sentence${count === 1 ? '' : 's'}`
}

export type WordFormsTableCell = 'blank' | 'na' | string

export type WordFormsTableModel = {
  columns: string[]
  rows: Array<{
    baseWord: string
    cells: WordFormsTableCell[]
  }>
}

function findFormForLabel(
  entry: WordFormEntry,
  columnLabel: string,
): WordFormItem | undefined {
  const normalized = columnLabel.trim().toLowerCase()
  return entry.forms.find(
    (item) => item.label.trim().toLowerCase() === normalized,
  )
}

export function buildWordFormsTableModel(
  entries: WordFormEntry[],
  mode: 'student' | 'answer',
): WordFormsTableModel {
  const printable = entries.filter(
    (entry) => entry.baseWord.trim().length > 0 && entry.forms.length > 0,
  )

  const columns: string[] = []
  const seenLabels = new Set<string>()

  for (const entry of printable) {
    for (const form of entry.forms) {
      const label = form.label.trim()
      if (!label) continue
      const key = label.toLowerCase()
      if (seenLabels.has(key)) continue
      seenLabels.add(key)
      columns.push(label)
    }
  }

  const rows = printable.map((entry) => ({
    baseWord: entry.baseWord,
    cells: columns.map((column) => {
      const form = findFormForLabel(entry, column)
      if (!form) return 'na' as const
      if (mode === 'student') return 'blank' as const
      return form.form.trim() || '—'
    }),
  }))

  return { columns, rows }
}

function normalizeWordKey(word: string): string {
  return word.trim().toLowerCase()
}

export function orderWordFormEntriesByWords(
  entries: readonly WordFormEntry[],
  words: readonly string[],
): WordFormEntry[] {
  const entryByWord = new Map<string, WordFormEntry>()
  for (const entry of entries) {
    const key = normalizeWordKey(entry.baseWord)
    if (!entryByWord.has(key)) {
      entryByWord.set(key, entry)
    }
  }

  const ordered: WordFormEntry[] = []
  const seen = new Set<string>()

  for (const word of words) {
    const key = normalizeWordKey(word)
    const entry = entryByWord.get(key)
    if (entry && !seen.has(key)) {
      ordered.push(entry)
      seen.add(key)
    }
  }

  for (const entry of entries) {
    const key = normalizeWordKey(entry.baseWord)
    if (!seen.has(key)) {
      ordered.push(entry)
      seen.add(key)
    }
  }

  return ordered
}

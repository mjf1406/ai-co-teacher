import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import { DictationAudioWorksheet } from '@/components/vocabulary/dictation-audio-worksheet'
import { VocabularyWordInput } from '@/components/vocabulary/vocabulary-word-input'
import { WorksheetChecklist } from '@/components/vocabulary/worksheet-checklist'
import { WorksheetPlaceholder } from '@/components/vocabulary/worksheet-placeholder'
import { requireAuth } from '@/lib/auth-guard'
import {
  WORKSHEET_LABELS,
  getWords,
  parseVocabularyText,
  parseWorksheetView,
  worksheetSelectionFromView,
  type WorksheetId,
  type WorksheetView,
} from '@/lib/vocabulary-types'

type VocabularySearch = {
  worksheet: WorksheetView
}

export const Route = createFileRoute('/vocabulary')({
  validateSearch: (search: Record<string, unknown>): VocabularySearch => ({
    worksheet: parseWorksheetView(search.worksheet),
  }),
  beforeLoad: requireAuth,
  component: VocabularyPage,
})

function VocabularyPage() {
  const { worksheet } = Route.useSearch()
  const [wordText, setWordText] = useState('')
  const [checked, setChecked] = useState(() => worksheetSelectionFromView(worksheet))

  useEffect(() => {
    setChecked(worksheetSelectionFromView(worksheet))
  }, [worksheet])

  const entries = useMemo(() => parseVocabularyText(wordText), [wordText])
  const words = useMemo(() => getWords(entries), [entries])

  function handleCheckedChange(id: WorksheetId, value: boolean) {
    setChecked((current) => ({ ...current, [id]: value }))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-8 py-8">
      <header>
        <h1 className="text-4xl font-bold">Vocabulary</h1>
        <p className="mt-2 text-muted-foreground">
          Enter words and definitions, choose worksheets, and generate materials for your students.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <VocabularyWordInput value={wordText} onChange={setWordText} entries={entries} />
        <WorksheetChecklist checked={checked} onCheckedChange={handleCheckedChange} />
      </div>

      <div className="space-y-10">
        {checked['dictation-audio'] ? <DictationAudioWorksheet words={words} /> : null}
        {checked['fill-in-the-blank'] ? (
          <WorksheetPlaceholder title={WORKSHEET_LABELS['fill-in-the-blank']} entries={entries} />
        ) : null}
        {checked['word-search'] ? (
          <WorksheetPlaceholder title={WORKSHEET_LABELS['word-search']} entries={entries} />
        ) : null}
        {checked['crossword-puzzle'] ? (
          <WorksheetPlaceholder title={WORKSHEET_LABELS['crossword-puzzle']} entries={entries} />
        ) : null}
        {checked['word-forms'] ? (
          <WorksheetPlaceholder title={WORKSHEET_LABELS['word-forms']} entries={entries} />
        ) : null}
      </div>
    </div>
  )
}

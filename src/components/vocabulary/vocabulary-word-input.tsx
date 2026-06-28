import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { VocabEntry } from '@/lib/vocabulary-types'

type VocabularyWordInputProps = {
  value: string
  onChange: (value: string) => void
  entries: VocabEntry[]
}

export function VocabularyWordInput({ value, onChange, entries }: VocabularyWordInputProps) {
  const withDefinitions = entries.filter((entry) => entry.definition).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Word list</CardTitle>
        <CardDescription>
          One entry per line. Add a definition after a colon, or enter a word only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="vocabulary-text" className="sr-only">
          Vocabulary list
        </Label>
        <Textarea
          id="vocabulary-text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            'compare: to examine likenesses\nculture: shared beliefs and practices\nidentity'
          }
          rows={8}
          className="min-h-48 font-mono text-sm"
        />
        <p className="text-sm text-muted-foreground">
          {entries.length} word{entries.length === 1 ? '' : 's'}
          {withDefinitions > 0
            ? ` · ${withDefinitions} with definition${withDefinitions === 1 ? '' : 's'}`
            : ''}
        </p>
      </CardContent>
    </Card>
  )
}

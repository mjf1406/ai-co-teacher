import { createFileRoute } from '@tanstack/react-router'

import { VocabularyPageShell } from '@/components/vocabulary/vocabulary-page-shell'

export const Route = createFileRoute('/vocabulary/')({
  component: CombinedVocabularyPage,
})

function CombinedVocabularyPage() {
  return <VocabularyPageShell mode="combined" />
}

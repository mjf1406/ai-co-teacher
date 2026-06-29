import { createFileRoute, notFound } from '@tanstack/react-router'

import { VocabularyPageShell } from '@/components/vocabulary/vocabulary-page-shell'
import { parseWorksheetId } from '@/lib/vocabulary-types'

export const Route = createFileRoute('/vocabulary/$worksheetId')({
  beforeLoad: ({ params }) => {
    if (!parseWorksheetId(params.worksheetId)) {
      throw notFound()
    }
  },
  component: SingleWorksheetPage,
})

function SingleWorksheetPage() {
  const { worksheetId } = Route.useParams()
  const id = parseWorksheetId(worksheetId)
  if (!id) throw notFound()
  return <VocabularyPageShell mode={id} />
}

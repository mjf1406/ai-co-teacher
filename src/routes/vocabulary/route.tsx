import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { VocabularyBuilderProvider } from '@/components/vocabulary/vocabulary-builder-context'
import { requireAuth } from '@/lib/auth-guard'
import { parseWorksheetView } from '@/lib/vocabulary-types'

export const Route = createFileRoute('/vocabulary')({
  beforeLoad: (ctx) => {
    requireAuth(ctx)

    const search = ctx.location.search as Record<string, unknown>
    if (search.worksheet !== undefined) {
      const view = parseWorksheetView(search.worksheet)
      if (view === 'all') {
        throw redirect({ to: '/vocabulary' })
      }
      throw redirect({
        to: '/vocabulary/$worksheetId',
        params: { worksheetId: view },
      })
    }
  },
  component: VocabularyLayout,
})

function VocabularyLayout() {
  return (
    <VocabularyBuilderProvider>
      <Outlet />
    </VocabularyBuilderProvider>
  )
}

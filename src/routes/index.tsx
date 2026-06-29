import { createFileRoute } from '@tanstack/react-router'

import { ToolSection } from '@/components/tool-section'
import { requireAuth } from '@/lib/auth-guard'
import { TOOL_SECTIONS } from '@/lib/tool-sections'

export const Route = createFileRoute('/')({
  beforeLoad: requireAuth,
  component: Home,
})

function Home() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-8 py-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold">AI Co-teacher</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Just the GenAI tools I use as a teacher.
        </p>
      </header>

      {TOOL_SECTIONS.map((section) => (
        <ToolSection key={section.title} {...section} />
      ))}
    </div>
  )
}

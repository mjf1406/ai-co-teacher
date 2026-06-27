import { createFileRoute } from '@tanstack/react-router'
import { Mic } from 'lucide-react'

import { ToolCard } from '@/components/tool-card'
import { requireAuth } from '@/lib/auth-guard'

const tools = [
  {
    title: 'Dictation',
    description: 'Create audio for your students to dictate',
    to: '/dictation' as const,
    icon: Mic,
  },
]

export const Route = createFileRoute('/')({
  beforeLoad: requireAuth,
  component: Home,
})

function Home() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold">AI Co-teacher</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Just the GenAI tools I use as a teacher.
        </p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.to} {...tool} />
        ))}
      </div>
    </div>
  )
}

import { ToolCard } from '@/components/tool-card'
import type { ToolSectionConfig } from '@/lib/tool-sections'

type ToolSectionProps = ToolSectionConfig

export function ToolSection({ title, description, items }: ToolSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ToolCard key={item.to} {...item} />
        ))}
      </div>
    </section>
  )
}

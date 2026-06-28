import { ChevronDown } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

type CustomizeSectionCollapsibleProps = {
  sectionName: string
  children: React.ReactNode
  show?: boolean
}

export function CustomizeSectionCollapsible({
  sectionName,
  children,
  show = true,
}: CustomizeSectionCollapsibleProps) {
  if (!show) {
    return null
  }

  return (
    <Collapsible defaultOpen={false}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="group cursor-pointer select-none hover:bg-muted/50">
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Customize {sectionName}</CardTitle>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

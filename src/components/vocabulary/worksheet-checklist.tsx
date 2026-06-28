import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { WORKSHEET_IDS, WORKSHEET_LABELS, type WorksheetId } from '@/lib/vocabulary-types'

type WorksheetChecklistProps = {
  checked: Record<WorksheetId, boolean>
  onCheckedChange: (id: WorksheetId, value: boolean) => void
}

export function WorksheetChecklist({ checked, onCheckedChange }: WorksheetChecklistProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Worksheets</CardTitle>
        <CardDescription>Choose which worksheets to show below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {WORKSHEET_IDS.map((id) => (
          <div key={id} className="flex items-center gap-3">
            <Checkbox
              id={`worksheet-${id}`}
              checked={checked[id]}
              onCheckedChange={(value) => onCheckedChange(id, value === true)}
            />
            <Label htmlFor={`worksheet-${id}`} className="cursor-pointer font-normal">
              {WORKSHEET_LABELS[id]}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

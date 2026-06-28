import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DrawOneWordWorksheet() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Draw One Word</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Students choose one vocabulary word and illustrate it on the printable
          worksheet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Draw One Word</CardTitle>
          <CardDescription>
            This section appears on the printable worksheet below Dictation when
            both are selected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When Dictation is included, students pick one word from their
            dictated word list, write it on the line, and draw a picture that
            shows what the word means.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

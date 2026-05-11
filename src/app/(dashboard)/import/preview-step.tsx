'use client'

import { Button } from '@/components/ui/button'

type Props = {
  data: { headers: string[]; rows: string[][]; totalLines: number }
  onConfirm: () => void
  onBack: () => void
}

export function PreviewStep({ data, onConfirm, onBack }: Props) {
  const displayRows = data.rows.slice(0, 10)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Preview</h2>
          <p className="text-sm text-muted-foreground">
            {data.totalLines} rows detected, {data.headers.length} columns. Showing first 10 rows.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onConfirm}>Continue to Mapping</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
              {data.headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, ri) => (
              <tr key={ri} className="border-b last:border-0">
                <td className="px-3 py-2 text-xs text-muted-foreground">{ri + 1}</td>
                {data.headers.map((_, ci) => (
                  <td key={ci} className="max-w-48 truncate px-3 py-2 text-xs">
                    {row[ci] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

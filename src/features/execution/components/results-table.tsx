import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ExecutionTestResult } from '../use-execution'

type ResultsTableProps = {
  results: Record<string, ExecutionTestResult>
}

function statusVariant(status: string) {
  if (status === 'passed') return 'default' as const
  if (status === 'failed' || status === 'error') return 'destructive' as const
  if (status === 'running') return 'secondary' as const
  return 'outline' as const
}

export function ResultsTable({ results }: ResultsTableProps) {
  const rows = Object.values(results)

  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Resultados por test</CardTitle>
          <Badge variant='secondary'>{rows.length}</Badge>
        </div>
        <p className='mt-1 text-sm text-muted-foreground'>
          Estado y salida de los tests reportados por la corrida actual
        </p>
      </CardHeader>
      <CardContent className='p-0'>
        {rows.length === 0 ? (
          <p className='p-6 text-sm text-muted-foreground'>
            Aún no hay resultados. Los tests aparecerán a medida que se ejecuten.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className='text-end'>Duración</TableHead>
                <TableHead>Salida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className='max-w-[320px]'>
                    <span className='block truncate font-mono text-xs'>
                      {result.id.split('::').slice(1).join(' :: ') || result.id}
                    </span>
                    <span className='block truncate text-xs text-muted-foreground'>
                      {result.id.split('::')[0]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(result.status)}>
                      {result.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-end tabular-nums'>
                    {result.duration !== undefined ? `${result.duration.toFixed(2)}s` : '—'}
                  </TableCell>
                  <TableCell className='max-w-[360px]'>
                    <span className='block truncate text-xs text-muted-foreground'>
                      {result.errorMsg || result.output || '—'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

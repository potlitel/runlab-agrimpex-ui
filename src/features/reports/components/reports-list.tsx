import { Eye, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ReportListItem } from '@/types/contract'

type ReportsListProps = {
  reports: ReportListItem[]
  loading: boolean
  error: string | null
  deletingId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

function formatDate(ts?: string) {
  if (!ts) return '—'
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString()
}

export function ReportsList({
  reports,
  loading,
  error,
  deletingId,
  onSelect,
  onDelete,
}: ReportsListProps) {
  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Historial de ejecuciones</CardTitle>
          <Badge variant='secondary'>{reports.length}</Badge>
        </div>
        <p className='mt-1 text-sm text-muted-foreground'>
          Reportes generados por el perfil activo
        </p>
      </CardHeader>
      <CardContent className='p-0'>
        {loading ? (
          <div className='space-y-2 p-6'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='h-10 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : error ? (
          <p className='p-6 text-sm text-destructive'>{error}</p>
        ) : reports.length === 0 ? (
          <p className='p-6 text-sm text-muted-foreground'>
            No hay reportes disponibles. Ejecuta pruebas para generar historial.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Reporte</TableHead>
                <TableHead className='text-end'>Total</TableHead>
                <TableHead className='text-end'>Pasados</TableHead>
                <TableHead className='text-end'>Fallidos</TableHead>
                <TableHead className='text-end'>Duración</TableHead>
                <TableHead className='text-end'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const failed = (report.summary.failed ?? 0) + (report.summary.errors ?? 0)
                return (
                  <TableRow key={report.id}>
                    <TableCell className='whitespace-nowrap text-sm'>
                      {formatDate(report.timestamp)}
                    </TableCell>
                    <TableCell className='max-w-[220px]'>
                      <span className='block truncate font-mono text-xs'>{report.id}</span>
                    </TableCell>
                    <TableCell className='text-end tabular-nums'>{report.summary.total}</TableCell>
                    <TableCell className='text-end tabular-nums text-emerald-600 dark:text-emerald-400'>
                      {report.summary.passed}
                    </TableCell>
                    <TableCell className='text-end tabular-nums text-destructive'>{failed}</TableCell>
                    <TableCell className='text-end tabular-nums'>
                      {report.summary.duration != null ? `${report.summary.duration.toFixed(1)}s` : '—'}
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button size='sm' variant='ghost' onClick={() => onSelect(report.id)}>
                          <Eye className='size-4' /> Ver
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='text-destructive hover:text-destructive'
                          disabled={deletingId === report.id}
                          onClick={() => {
                            const ok = window.confirm(
                              `¿Eliminar el reporte ${report.id}? Esta acción no se puede deshacer.`
                            )
                            if (ok) onDelete(report.id)
                          }}
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

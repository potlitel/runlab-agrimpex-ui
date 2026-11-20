import { AlertCircle, FileText, FolderX, RefreshCw } from 'lucide-react'
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
import type { TxtData } from '@/types/contract'

type Props = {
  data: TxtData | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export function TxtDataPanel({ data, loading, error, onRefresh }: Props) {
  const columns = data?.columns ?? []
  const rows = (data?.rows ?? []) as Array<Record<string, unknown>>

  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <div className='flex items-center justify-between gap-2'>
          <div>
            <CardTitle>Datos TXT</CardTitle>
            {data?.folder ? (
              <p className='mt-1 truncate font-mono text-xs text-muted-foreground'>{data.folder}</p>
            ) : null}
          </div>
          <Button size='sm' variant='outline' onClick={onRefresh} disabled={loading}>
            <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} /> Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        {loading ? (
          <div className='space-y-2 p-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='h-8 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : error ? (
          <State icon={AlertCircle} title='Error al cargar datos TXT' description={error} destructive />
        ) : data && !data.configured ? (
          <State
            icon={FolderX}
            title='Fuente no configurada'
            description='Configura la carpeta de datos TXT en Ajustes para visualizar el contenido.'
          />
        ) : data?.error ? (
          <State icon={AlertCircle} title='Error de lectura' description={String(data.error)} destructive />
        ) : columns.length === 0 ? (
          <State
            icon={FileText}
            title='Sin datos'
            description='No se encontraron columnas o filas parseadas en la carpeta configurada.'
          />
        ) : (
          <div className='overflow-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col} className='whitespace-nowrap'>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className='py-8 text-center text-sm text-muted-foreground'>
                      No hay filas.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={col} className='max-w-[320px] truncate text-xs'>
                          {row[col] == null ? '—' : String(row[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function State({
  icon: Icon,
  title,
  description,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  destructive?: boolean
}) {
  return (
    <div className='flex flex-col items-center justify-center gap-3 p-10 text-center'>
      <Icon className={`size-8 ${destructive ? 'text-destructive' : 'text-muted-foreground'}`} />
      <div>
        <h3 className='font-medium'>{title}</h3>
        <p className={`mt-1 text-sm ${destructive ? 'text-destructive' : 'text-muted-foreground'}`}>
          {description}
        </p>
      </div>
    </div>
  )
}

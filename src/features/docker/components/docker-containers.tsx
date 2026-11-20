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

type ContainersData = {
  ok?: boolean
  error?: string
  containers?: Array<Record<string, unknown>>
} | null

type Props = {
  data: ContainersData
  loading: boolean
  error: string | null
}

export function DockerContainers({ data, loading, error }: Props) {
  const containers = data?.containers ?? []
  const apiError = data && data.ok === false ? String(data.error ?? 'Error desconocido') : null

  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Contenedores</CardTitle>
          <Badge variant='secondary'>{containers.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        {loading ? (
          <div className='space-y-2 p-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='h-8 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : error ? (
          <p className='p-4 text-sm text-destructive'>{error}</p>
        ) : apiError ? (
          <p className='p-4 text-sm text-muted-foreground'>{apiError}</p>
        ) : containers.length === 0 ? (
          <p className='p-4 text-sm text-muted-foreground'>
            No hay contenedores en ejecución.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Imagen</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Puertos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.map((c, idx) => (
                <TableRow key={String(c.name ?? idx)}>
                  <TableCell className='font-mono text-xs'>{String(c.name ?? '—')}</TableCell>
                  <TableCell className='font-mono text-xs'>{String(c.image ?? '—')}</TableCell>
                  <TableCell className='text-xs'>{String(c.status ?? '—')}</TableCell>
                  <TableCell className='max-w-[260px] truncate font-mono text-xs' title={String(c.ports ?? '')}>
                    {String(c.ports ?? '—') || '—'}
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

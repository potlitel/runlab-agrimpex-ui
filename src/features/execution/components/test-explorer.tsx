import { useMemo, useState } from 'react'
import { ChevronRight, Eye, FileCode2, RefreshCw, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TestFileDialog } from './test-file-dialog'
import type { TestTree } from '@/types/contract'

type TestExplorerProps = {
  tree?: TestTree
  loading: boolean
  error: string | null
  running: boolean
  selected: string[]
  onToggleTest: (id: string) => void
  onToggleFile: (ids: string[], checked: boolean) => void
  onClear: () => void
  onRefresh: () => void
}

export function TestExplorer({
  tree,
  loading,
  error,
  running,
  selected,
  onToggleTest,
  onToggleFile,
  onClear,
  onRefresh,
}: TestExplorerProps) {
  const [query, setQuery] = useState('')
  const [fileToView, setFileToView] = useState<string | null>(null)

  const files = useMemo(() => {
    const entries = Object.entries(tree?.files ?? {})
    if (!query.trim()) return entries
    const needle = query.trim().toLowerCase()
    return entries
      .map(([file, ids]) => [
        file,
        ids.filter(
          (id) =>
            id.toLowerCase().includes(needle) ||
            file.toLowerCase().includes(needle)
        ),
      ] as const)
      .filter(([, ids]) => ids.length > 0)
  }, [tree, query])

  const visibleCount = files.reduce((total, [, ids]) => total + ids.length, 0)

  return (
    <Card className='flex min-h-0 flex-col'>
      <CardHeader className='gap-3 border-b pb-4'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              Catálogo de tests
              <Badge variant='secondary'>{tree?.total ?? 0}</Badge>
            </CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>
              Selecciona los tests que quieres ejecutar
            </p>
          </div>
          <Button
            size='sm'
            variant='outline'
            onClick={onRefresh}
            disabled={loading || running}
          >
            <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
            {loading ? 'Actualizando' : 'Actualizar'}
          </Button>
        </div>
        <div className='relative'>
          <Search className='absolute start-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Buscar test o archivo…'
            className='h-8 ps-8'
          />
        </div>
        {selected.length > 0 && (
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span>{selected.length} seleccionados</span>
            <Button
              size='sm'
              variant='ghost'
              className='h-7 px-2 text-xs'
              onClick={onClear}
            >
              Limpiar
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className='min-h-0 flex-1 p-0'>
        {error ? (
          <div className='p-6 text-sm text-destructive'>{error}</div>
        ) : files.length === 0 ? (
          <div className='p-6 text-sm text-muted-foreground'>
            {loading
              ? 'Cargando catálogo…'
              : 'No hay tests para mostrar. Actualiza el catálogo o configura el proyecto en Ajustes.'}
          </div>
        ) : (
          <ScrollArea className='h-[420px]'>
            <div className='space-y-3 p-4'>
              {files.map(([file, ids]) => {
                const allSelected = ids.every((id) => selected.includes(id))
                return (
                  <div key={file} className='rounded-lg border'>
                    <div className='flex items-center gap-2 border-b bg-muted/40 px-3 py-2'>
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) =>
                          onToggleFile(ids, checked === true)
                        }
                        aria-label={`Seleccionar archivo ${file}`}
                      />
                      <FileCode2 className='size-4 text-muted-foreground' />
                      <span className='min-w-0 flex-1 truncate font-mono text-xs'>
                        {file.split('/').pop()}
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        {ids.length}
                      </span>
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        className='size-7'
                        onClick={() => setFileToView(file)}
                        aria-label={`Ver contenido de ${file}`}
                      >
                        <Eye className='size-3.5' />
                      </Button>
                    </div>
                    <div className='divide-y'>
                      {ids.map((id) => (
                        <label
                          key={id}
                          className='flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-muted/30'
                        >
                          <Checkbox
                            checked={selected.includes(id)}
                            onCheckedChange={() => onToggleTest(id)}
                            aria-label={`Seleccionar ${id}`}
                          />
                          <ChevronRight className='size-3 text-muted-foreground' />
                          <span className='min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground'>
                            {id.split('::').slice(1).join(' :: ') || id}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
        {!error && visibleCount > 0 && (
          <p className='border-t px-4 py-2 text-xs text-muted-foreground'>
            {visibleCount} tests visibles
          </p>
        )}
      </CardContent>
      <TestFileDialog
        file={fileToView}
        onOpenChange={(open) => {
          if (!open) setFileToView(null)
        }}
      />
    </Card>
  )
}

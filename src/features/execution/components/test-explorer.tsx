import { useMemo, useState } from 'react'
import { ChevronRight, Eye, FileCode2, FolderOpen, Info, RefreshCw, Search } from 'lucide-react'
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
  projectConfigured?: boolean
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
  projectConfigured = true,
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
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0'>
            <CardTitle className='flex flex-wrap items-center gap-2'>
              Catálogo de tests
              <Badge variant='secondary'>{tree?.total ?? 0}</Badge>
              {tree?.projects?.length ? (
                <Badge variant='outline'>{tree.projects.length} projects</Badge>
              ) : null}
            </CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>
              Selecciona specs para ejecutar o abre cualquier archivo del proyecto en el visor.
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setFileToView('')}
              title='Abrir un archivo del proyecto por ruta relativa'
            >
              <FolderOpen className='size-4' />
              Abrir archivo
            </Button>
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
        <div className='flex items-start gap-2 rounded-md border border-sky-500/20 bg-sky-500/5 p-2.5 text-xs text-muted-foreground'>
          <Info className='mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400' />
          <p>
            <span className='font-medium text-foreground'>Recomendación:</span> usa{' '}
            <span className='font-medium'>Actualizar</span> para refrescar el catálogo y sincronizarlo con el{' '}
            <span className='font-mono'>projectPath</span> configurado, especialmente tras cambios de
            proyecto/configuración o reinicios del proceso de la API. Esto evita ver specs desfasados y errores al abrir
            archivos.
          </p>
        </div>
        <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground'>
          <span>
            {selected.length > 0 ? `${selected.length} seleccionados` : 'Sin selección'}
            {visibleCount > 0 ? ` · ${visibleCount} visibles` : ''}
          </span>
          {selected.length > 0 && (
            <Button
              size='sm'
              variant='ghost'
              className='h-7 px-2 text-xs'
              onClick={onClear}
            >
              Limpiar selección
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='min-h-0 flex-1 p-0'>
        {error ? (
          <div className='space-y-2 p-6 text-sm'>
            <p className='font-medium text-destructive'>No se pudo cargar el catálogo</p>
            <p className='text-muted-foreground'>{error}</p>
            {!projectConfigured && (
              <p className='text-muted-foreground'>
                Configura la ruta del proyecto y el comando Playwright en Ajustes para descubrir y ejecutar tests.
              </p>
            )}
          </div>
        ) : files.length === 0 ? (
          <div className='space-y-3 p-6 text-sm text-muted-foreground'>
            <p>
              {loading
                ? 'Cargando catálogo de tests…'
                : 'No hay tests para mostrar con el estado actual.'}
            </p>
            {!loading && (
              <ul className='list-disc space-y-1 ps-5'>
                <li>Actualiza el catálogo para recolectar specs desde el proyecto configurado.</li>
                <li>Usa «Abrir archivo» para inspeccionar archivos del proyecto aunque el catálogo esté vacío.</li>
                <li>Verifica la configuración del proyecto y del comando Playwright en Ajustes.</li>
              </ul>
            )}
          </div>
        ) : (
          <ScrollArea className='h-[420px]'>
            <div className='space-y-3 p-4'>
              {files.map(([file, ids]) => {
                const allSelected = ids.every((id) => selected.includes(id))
                const someSelected = !allSelected && ids.some((id) => selected.includes(id))
                return (
                  <div key={file} className='rounded-lg border'>
                    <div className='flex items-center gap-2 border-b bg-muted/40 px-3 py-2'>
                      <Checkbox
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={(checked) =>
                          onToggleFile(ids, checked === true)
                        }
                        aria-label={`Seleccionar archivo ${file}`}
                      />
                      <FileCode2 className='size-4 text-muted-foreground' />
                      <div className='min-w-0 flex-1'>
                        <span className='block truncate font-mono text-xs' title={file}>
                          {file}
                        </span>
                      </div>
                      <span className='text-xs text-muted-foreground'>
                        {ids.length}
                      </span>
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        className='h-7 gap-1 px-2 text-xs'
                        onClick={() => setFileToView(file)}
                        aria-label={`Ver contenido de ${file}`}
                      >
                        <Eye className='size-3.5' />
                        Ver
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
                          <span className='min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground' title={id}>
                            {id.split('::').slice(1).join(' › ') || id}
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
            {visibleCount} tests visibles · {Object.keys(tree?.files ?? {}).length} archivos
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

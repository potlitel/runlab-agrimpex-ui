import { useDeferredValue, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Copy,
  FileCode2,
  FolderOpen,
  Search,
  WrapText,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { testsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type TestFileDialogProps = {
  file: string | null
  onOpenChange: (open: boolean) => void
}

function formatSize(bytes?: number) {
  if (bytes == null || Number.isNaN(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value?: string | number | Date) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copiado`)
  } catch {
    toast.error(`No se pudo copiar ${label.toLowerCase()}`)
  }
}

export function TestFileDialog({ file, onOpenChange }: TestFileDialogProps) {
  const open = file !== null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <FileViewer key={file} initialFile={file ?? ''} /> : null}
    </Dialog>
  )
}

function FileViewer({ initialFile }: { initialFile: string }) {
  const [draftPath, setDraftPath] = useState(initialFile)
  const [activePath, setActivePath] = useState(initialFile)
  const [search, setSearch] = useState('')
  const [wrap, setWrap] = useState(false)
  const deferredSearch = useDeferredValue(search)

  const query = useQuery({
    queryKey: ['tests', 'file', activePath],
    queryFn: () => testsApi.getFile(activePath),
    enabled: !!activePath,
    retry: false,
  })

  const content = query.data?.content ?? ''
  const lines = useMemo(() => content.split('\n'), [content])
  const needle = deferredSearch.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!needle) return lines.map((text, index) => ({ index, text }))
    return lines
      .map((text, index) => ({ index, text }))
      .filter(({ text, index }) => {
        const lineNo = String(index + 1)
        return lineNo.includes(needle) || text.toLowerCase().includes(needle)
      })
  }, [lines, needle])

  const errorMessage =
    query.error instanceof Error ? query.error.message : 'No se pudo cargar el archivo.'

  function openPath(next: string) {
    const trimmed = next.trim()
    if (!trimmed) {
      toast.error('Ingresa la ruta relativa del archivo')
      return
    }
    setActivePath(trimmed)
    setSearch('')
  }

  const title = activePath ? activePath.split('/').pop() || activePath : 'Visor de archivos'
  const metaPath = query.data?.path || activePath
  const lineDigits = Math.max(2, String(lines.length || 1).length)

  return (
    <DialogContent className='flex h-[85vh] max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl'>
      <DialogHeader className='border-b px-5 py-4 text-start'>
        <div className='flex items-start justify-between gap-3 pr-8'>
          <div className='min-w-0 space-y-1'>
            <DialogTitle className='flex items-center gap-2'>
              <FileCode2 className='size-4 shrink-0 text-muted-foreground' />
              <span className='truncate'>{title}</span>
            </DialogTitle>
            <DialogDescription className='truncate font-mono text-xs'>
              {activePath
                ? metaPath
                : 'Abre cualquier archivo del proyecto configurado indicando su ruta relativa.'}
            </DialogDescription>
          </div>
          {activePath && (
            <div className='hidden shrink-0 items-center gap-2 sm:flex'>
              <Badge variant='secondary'>{lines.length} líneas</Badge>
              <Badge variant='outline'>{formatSize(query.data?.size)}</Badge>
            </div>
          )}
        </div>

        <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
          <div className='relative flex-1'>
            <FolderOpen className='pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={draftPath}
              onChange={(e) => setDraftPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  openPath(draftPath)
                }
              }}
              placeholder='Ruta relativa al proyecto, p. ej. tests/example.spec.ts'
              className='ps-8 font-mono text-xs'
            />
          </div>
          <div className='flex items-center gap-2'>
            <Button type='button' onClick={() => openPath(draftPath)} disabled={!draftPath.trim()}>
              Abrir archivo
            </Button>
            {activePath && (
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => void copyText(activePath, 'Ruta')}
                aria-label='Copiar ruta'
                title='Copiar ruta'
              >
                <Copy className='size-4' />
              </Button>
            )}
          </div>
        </div>

        {activePath && (
          <div className='mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
              <span>{filtered.length} líneas visibles</span>
              <span className='hidden sm:inline'>·</span>
              <span>Modificado: {formatDate(query.data?.mtime)}</span>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='relative min-w-[220px] flex-1 sm:flex-none'>
                <Search className='pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Buscar en el archivo…'
                  className='h-8 ps-8 text-xs'
                />
                {search && (
                  <button
                    type='button'
                    className='absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                    onClick={() => setSearch('')}
                    aria-label='Limpiar búsqueda'
                  >
                    <X className='size-3.5' />
                  </button>
                )}
              </div>
              <Button
                type='button'
                variant={wrap ? 'secondary' : 'outline'}
                size='sm'
                className='h-8'
                onClick={() => setWrap((v) => !v)}
              >
                <WrapText className='size-4' />
                Ajuste
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8'
                onClick={() => void copyText(content, 'Contenido')}
                disabled={!content}
              >
                <Copy className='size-4' />
                Copiar
              </Button>
            </div>
          </div>
        )}
      </DialogHeader>

      <div className='min-h-0 flex-1'>
        {!activePath ? (
          <div className='flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted-foreground'>
            <FolderOpen className='size-10 opacity-50' />
            <div>
              <p className='font-medium text-foreground'>Explora archivos del proyecto</p>
              <p className='mt-1 max-w-md'>
                Ingresa una ruta relativa al <span className='font-mono'>projectPath</span> configurado
                (por ejemplo <span className='font-mono'>playwright.config.ts</span> o un spec dentro de{' '}
                <span className='font-mono'>tests/</span>) y presiona Abrir archivo.
              </p>
            </div>
          </div>
        ) : query.isPending ? (
          <div className='space-y-2 p-5'>
            <Skeleton className='h-4 w-2/3' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-4/5' />
            <Skeleton className='h-4 w-full' />
          </div>
        ) : query.isError ? (
          <div className='flex h-full flex-col items-center justify-center gap-2 p-8 text-center'>
            <p className='font-medium text-destructive'>No se pudo abrir el archivo</p>
            <p className='max-w-lg text-sm text-muted-foreground'>{errorMessage}</p>
            <p className='text-xs text-muted-foreground'>
              Verifica que la ruta sea relativa al proyecto configurado y que el archivo exista.
            </p>
          </div>
        ) : (
          <ScrollArea className='h-full'>
            <div className='min-w-full p-0'>
              <pre
                className={cn(
                  'm-0 min-h-full bg-muted/20 p-4 font-mono text-[13px] leading-6',
                  wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                )}
              >
                {filtered.length === 0 ? (
                  <span className='text-muted-foreground'>
                    {needle ? 'No hay coincidencias para la búsqueda actual.' : 'Archivo vacío.'}
                  </span>
                ) : (
                  filtered.map(({ index, text }) => (
                    <div key={index} className='grid grid-cols-[auto_1fr] gap-x-4'>
                      <span
                        className='select-none text-end text-muted-foreground/60 tabular-nums'
                        style={{ minWidth: `${lineDigits}ch` }}
                      >
                        {index + 1}
                      </span>
                      <code className='min-w-0'>{text || ' '}</code>
                    </div>
                  ))
                )}
              </pre>
            </div>
          </ScrollArea>
        )}
      </div>
    </DialogContent>
  )
}

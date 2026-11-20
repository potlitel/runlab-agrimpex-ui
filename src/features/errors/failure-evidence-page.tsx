import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  Film,
  FolderX,
  Image as ImageIcon,
  ImageOff,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { useProfileStore } from '@/stores/profileStore'
import type { EvidenceItem, EvidenceKind } from '@/types/contract'
import { useFailureEvidence } from './use-failure-evidence'

const PAGE_SIZE = 24

function formatDate(ms?: number | null) {
  if (!ms) return '—'
  const d = new Date(ms)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

function formatSize(bytes?: number | null) {
  if (bytes == null || Number.isNaN(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function kindLabel(kind: EvidenceKind) {
  if (kind === 'image') return 'Imagen'
  if (kind === 'video') return 'Video'
  if (kind === 'trace') return 'Traza'
  if (kind === 'context') return 'Contexto'
  return 'Otro'
}

function statusVariant(status?: string | null) {
  if (status === 'passed') return 'default' as const
  if (status === 'failed' || status === 'error') return 'destructive' as const
  return 'outline' as const
}

function shortTestId(testId?: string | null) {
  if (!testId) return '—'
  const parts = testId.split('::')
  return parts.slice(1).join(' › ') || testId
}

export function FailureEvidencePage() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return (
    <FailureEvidenceView
      key={activeProfileId ?? 'none'}
      profileName={activeProfile?.name}
    />
  )
}

function FailureEvidenceView({ profileName }: { profileName?: string }) {
  const evidence = useFailureEvidence()
  const { data, items } = evidence

  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<'all' | EvidenceKind>('all')
  const [status, setStatus] = useState<'all' | 'failed' | 'error' | 'other'>('all')
  const [source, setSource] = useState<'all' | 'folder' | 'report'>('all')
  const [groupBy, setGroupBy] = useState<'none' | 'report' | 'test'>('none')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (kind !== 'all' && it.kind !== kind) return false
      if (source !== 'all' && it.source !== source) return false
      if (status !== 'all') {
        const st = String(it.status || '').toLowerCase()
        if (status === 'failed' && st !== 'failed') return false
        if (status === 'error' && st !== 'error') return false
        if (status === 'other' && (st === 'failed' || st === 'error')) return false
      }
      if (q) {
        const hay = [it.name, it.displayName, it.testId, it.reportId, it.assetPath, it.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, search, kind, source, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  useEffect(() => { setPage(1) }, [search, kind, source, status, groupBy])

  const selectedIndex = filtered.findIndex((i) => i.id === evidence.selectedId)
  const selectedItem = selectedIndex >= 0 ? filtered[selectedIndex] : null

  function openByOffset(offset: number) {
    if (selectedIndex < 0) return
    const next = filtered[selectedIndex + offset]
    if (next) evidence.openItem(next.id)
  }

  const folderMissing = !!(data?.folderMissing || data?.missing)
  const noSources = items.length === 0

  return (
    <>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight'>Evidencia de fallos</h1>
            <p className='text-sm text-muted-foreground'>
              Capturas y artefactos de fallos (carpeta configurada y reportes de ejecución)
            </p>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <Badge variant='secondary'>{profileName ?? 'Sin perfil activo'}</Badge>
            <Button size='sm' variant='outline' onClick={evidence.refresh} disabled={evidence.loading}>
              <RefreshCw className={evidence.loading ? 'size-4 animate-spin' : 'size-4'} />
              Actualizar
            </Button>
            <HeaderTools />
          </div>
        </div>
      </Header>
      <Main>
        {evidence.unavailable ? (
          <StateCard
            icon={AlertCircle}
            title='Módulo no disponible'
            description='La evidencia de fallos no está disponible para el perfil activo o el acceso fue rechazado.'
          />
        ) : evidence.loading ? (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className='aspect-video animate-pulse rounded-lg border bg-muted' />
            ))}
          </div>
        ) : evidence.error ? (
          <StateCard icon={AlertCircle} title='Error al cargar evidencias' description={evidence.error} destructive />
        ) : noSources ? (
          <StateCard
            icon={folderMissing ? FolderX : ImageOff}
            title={folderMissing ? 'Sin evidencias disponibles' : (!data?.configured ? 'Sin evidencias' : 'Sin evidencias')}
            description={
              folderMissing
                ? `La carpeta configurada no existe${data?.folder ? `: ${data.folder}` : ''} y no se encontraron evidencias de fallos en los reportes.`
                : !data?.configured
                  ? 'No hay carpeta configurada y no se encontraron evidencias de fallos en los reportes. Configura "Carpeta de evidencias/imágenes" o ejecuta pruebas con captura de fallos.'
                  : 'No se encontraron evidencias en la carpeta configurada ni en los reportes de ejecución.'
            }
          />
        ) : (
          <div className='space-y-4'>
            <Card>
              <CardHeader className='border-b pb-4'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <CardTitle>Evidencias</CardTitle>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='secondary'>Total {items.length}</Badge>
                    <Badge variant='outline'>Reportes {data?.counts?.reports ?? items.filter(i => i.source === 'report').length}</Badge>
                    <Badge variant='outline'>Carpeta {data?.counts?.folder ?? items.filter(i => i.source === 'folder').length}</Badge>
                    {filtered.length !== items.length && <Badge>Filtradas {filtered.length}</Badge>}
                  </div>
                </div>
                {data?.folder && (
                  <p className='mt-1 truncate font-mono text-xs text-muted-foreground'>
                    Carpeta: {data.folder}{folderMissing ? ' (no encontrada)' : ''}
                  </p>
                )}
              </CardHeader>
              <CardContent className='space-y-4 p-4'>
                <div className='grid gap-2 md:grid-cols-2 lg:grid-cols-6'>
                  <div className='relative lg:col-span-2'>
                    <Search className='pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder='Buscar por test, reporte, nombre...'
                      className='pl-8'
                    />
                  </div>
                  <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
                    <SelectTrigger><SelectValue placeholder='Tipo' /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todos los tipos</SelectItem>
                      <SelectItem value='image'>Imágenes</SelectItem>
                      <SelectItem value='video'>Videos</SelectItem>
                      <SelectItem value='trace'>Trazas</SelectItem>
                      <SelectItem value='context'>Contexto</SelectItem>
                      <SelectItem value='other'>Otros</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                    <SelectTrigger><SelectValue placeholder='Estado' /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todos los estados</SelectItem>
                      <SelectItem value='failed'>Fallidos</SelectItem>
                      <SelectItem value='error'>Errores</SelectItem>
                      <SelectItem value='other'>Otros</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
                    <SelectTrigger><SelectValue placeholder='Origen' /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todos los orígenes</SelectItem>
                      <SelectItem value='report'>Reportes</SelectItem>
                      <SelectItem value='folder'>Carpeta</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
                    <SelectTrigger><SelectValue placeholder='Agrupar' /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>Sin agrupar</SelectItem>
                      <SelectItem value='report'>Por reporte</SelectItem>
                      <SelectItem value='test'>Por test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filtered.length === 0 ? (
                  <p className='py-8 text-center text-sm text-muted-foreground'>No hay evidencias que coincidan con los filtros.</p>
                ) : (
                  <>
                    <EvidenceGroups
                      items={paged}
                      groupBy={groupBy}
                      onOpen={(id) => evidence.openItem(id)}
                    />
                    <div className='flex items-center justify-between gap-2 border-t pt-3'>
                      <p className='text-xs text-muted-foreground'>
                        Mostrando {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length}
                      </p>
                      <div className='flex items-center gap-2'>
                        <Button size='sm' variant='outline' disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                          Anterior
                        </Button>
                        <span className='text-xs text-muted-foreground'>{safePage} / {totalPages}</span>
                        <Button size='sm' variant='outline' disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Main>

      <EvidenceDialog
        item={selectedItem}
        index={selectedIndex >= 0 ? selectedIndex : -1}
        total={filtered.length}
        onClose={evidence.closeItem}
        onPrev={() => openByOffset(-1)}
        onNext={() => openByOffset(1)}
      />
    </>
  )
}

function EvidenceGroups({
  items,
  groupBy,
  onOpen,
}: {
  items: EvidenceItem[]
  groupBy: 'none' | 'report' | 'test'
  onOpen: (id: string) => void
}) {
  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'all', label: '', items }]
    const map = new Map<string, EvidenceItem[]>()
    for (const it of items) {
      let key = 'sin-dato'
      let label = 'Sin información'
      if (groupBy === 'report') {
        key = it.reportId || 'sin-reporte'
        label = it.reportId ? `Reporte: ${it.reportId}` : 'Sin reporte (carpeta)'
      } else {
        key = it.testId || 'sin-test'
        label = it.testId ? `Test: ${shortTestId(it.testId)}` : 'Sin test'
      }
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
      void label
    }
    return Array.from(map.entries()).map(([key, arr]) => {
      const first = arr[0]
      const label = groupBy === 'report'
        ? (first.reportId ? `Reporte: ${first.reportId}` : 'Sin reporte (carpeta)')
        : (first.testId ? `Test: ${shortTestId(first.testId)}` : 'Sin test')
      return { key, label, items: arr }
    })
  }, [items, groupBy])

  return (
    <div className='space-y-6'>
      {groups.map((g) => (
        <div key={g.key} className='space-y-3'>
          {groupBy !== 'none' && (
            <div className='flex items-center gap-2'>
              <h3 className='truncate text-sm font-medium'>{g.label}</h3>
              <Badge variant='secondary'>{g.items.length}</Badge>
            </div>
          )}
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {g.items.map((item) => (
              <EvidenceCard key={item.id} item={item} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EvidenceCard({ item, onOpen }: { item: EvidenceItem; onOpen: (id: string) => void }) {
  const [broken, setBroken] = useState(false)
  return (
    <button
      type='button'
      className='group overflow-hidden rounded-lg border bg-card text-start transition hover:border-primary/40 hover:shadow-sm'
      onClick={() => onOpen(item.id)}
    >
      <div className='relative aspect-video overflow-hidden bg-muted'>
        {item.kind === 'image' && !broken ? (
          <img
            src={item.url}
            alt={item.displayName || item.name}
            loading='lazy'
            className='h-full w-full object-cover transition group-hover:scale-[1.02]'
            onError={() => setBroken(true)}
          />
        ) : item.kind === 'video' ? (
          <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
            <Film className='size-10' />
          </div>
        ) : item.kind === 'trace' ? (
          <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
            <FileArchive className='size-10' />
          </div>
        ) : item.kind === 'context' ? (
          <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
            <FileText className='size-10' />
          </div>
        ) : (
          <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
            <ImageIcon className='size-10' />
          </div>
        )}
        <div className='absolute left-2 top-2 flex gap-1'>
          <Badge variant='secondary' className='bg-background/80 backdrop-blur'>{kindLabel(item.kind)}</Badge>
        </div>
      </div>
      <div className='space-y-1.5 p-3'>
        <p className='truncate font-mono text-xs' title={item.displayName || item.name}>
          {item.displayName || item.name}
        </p>
        <div className='flex flex-wrap items-center gap-1.5'>
          {item.status && <Badge variant={statusVariant(item.status)} className='px-1.5 py-0 text-[10px]'>{item.status}</Badge>}
          <Badge variant='outline' className='px-1.5 py-0 text-[10px]'>{item.source === 'report' ? 'reporte' : 'carpeta'}</Badge>
        </div>
        {item.testId && (
          <p className='truncate text-xs text-muted-foreground' title={item.testId}>
            {shortTestId(item.testId)}
          </p>
        )}
        <p className='text-xs text-muted-foreground'>
          {formatDate(item.mtime ?? (item.timestamp ? Date.parse(item.timestamp) : null))} · {formatSize(item.size ?? null)}
        </p>
      </div>
    </button>
  )
}

function EvidenceDialog({
  item,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  item: EvidenceItem | null
  index: number
  total: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const open = !!item

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev() }
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onPrev, onNext])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className='sm:max-w-5xl'>
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className='truncate pr-8 font-mono text-sm' title={item.displayName || item.name}>
                {item.displayName || item.name}
              </DialogTitle>
              <div className='flex flex-wrap items-center gap-2 pt-1'>
                <Badge variant='secondary'>{kindLabel(item.kind)}</Badge>
                {item.status && <Badge variant={statusVariant(item.status)}>{item.status}</Badge>}
                <Badge variant='outline'>{item.source === 'report' ? 'reporte' : 'carpeta'}</Badge>
                {index >= 0 && total > 0 && (
                  <span className='text-xs text-muted-foreground'>{index + 1} / {total}</span>
                )}
              </div>
            </DialogHeader>

            <div className='space-y-3'>
              <div className='grid gap-2 rounded-md border bg-muted/20 p-3 text-xs sm:grid-cols-2'>
                <div><span className='text-muted-foreground'>Fecha:</span> {formatDate(item.mtime ?? (item.timestamp ? Date.parse(item.timestamp) : null))}</div>
                <div><span className='text-muted-foreground'>Tamaño:</span> {formatSize(item.size ?? null)}</div>
                <div className='truncate sm:col-span-2'><span className='text-muted-foreground'>Test:</span> <span className='font-mono' title={item.testId || ''}>{item.testId ? shortTestId(item.testId) : '—'}</span></div>
                <div className='flex items-center gap-2 sm:col-span-2'>
                  <span className='text-muted-foreground'>Reporte:</span>
                  {item.reportId ? (
                    <span className='truncate font-mono'>{item.reportId}</span>
                  ) : '—'}
                  {item.reportId && (
                    <Button asChild size='sm' variant='link' className='h-auto p-0'>
                      <Link to='/reports'>Ir a reportes</Link>
                    </Button>
                  )}
                </div>
              </div>

              <EvidencePreview item={item} />

              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <Button size='sm' variant='outline' onClick={onPrev} disabled={index <= 0}>
                    <ChevronLeft className='size-4' /> Anterior
                  </Button>
                  <Button size='sm' variant='outline' onClick={onNext} disabled={index < 0 || index >= total - 1}>
                    Siguiente <ChevronRight className='size-4' />
                  </Button>
                </div>
                <div className='flex items-center gap-2'>
                  <Button size='sm' variant='outline' asChild>
                    <a href={item.downloadUrl || item.url} target='_blank' rel='noreferrer'>
                      <Download className='size-4' /> Descargar/Abrir
                    </a>
                  </Button>
                  <Button size='sm' variant='outline' asChild>
                    <a href={item.url} target='_blank' rel='noreferrer'>
                      <ExternalLink className='size-4' /> Abrir en pestaña
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EvidencePreview({ item }: { item: EvidenceItem }) {
  const [failed, setFailed] = useState(false)
  if (item.kind === 'image') {
    if (failed) {
      return (
        <div className='flex flex-col items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-10 text-center'>
          <AlertCircle className='size-8 text-destructive' />
          <p className='text-sm text-destructive'>No se pudo cargar la imagen.</p>
        </div>
      )
    }
    return (
      <div className='overflow-hidden rounded-md border bg-muted/30'>
        <img
          src={item.url}
          alt={item.displayName || item.name}
          className='max-h-[60vh] w-full object-contain'
          onError={() => setFailed(true)}
        />
      </div>
    )
  }
  if (item.kind === 'video') {
    return (
      <div className='overflow-hidden rounded-md border bg-black/90'>
        <video src={item.url} controls className='max-h-[60vh] w-full' />
      </div>
    )
  }
  if (item.kind === 'trace') {
    return (
      <div className='flex flex-col items-center justify-center gap-3 rounded-md border bg-muted/20 p-10 text-center'>
        <FileArchive className='size-10 text-muted-foreground' />
        <div>
          <p className='font-medium'>Traza de Playwright (.zip)</p>
          <p className='mt-1 text-sm text-muted-foreground'>Descárgala y ábrela con el visor de trazas de Playwright (p.ej. <span className='font-mono'>npx playwright show-trace</span> o trace.playwright.dev).</p>
        </div>
      </div>
    )
  }
  if (item.kind === 'context') {
    return (
      <div className='flex flex-col items-center justify-center gap-3 rounded-md border bg-muted/20 p-10 text-center'>
        <FileText className='size-10 text-muted-foreground' />
        <div>
          <p className='font-medium'>Contexto de error</p>
          <p className='mt-1 text-sm text-muted-foreground'>Archivo de contexto generado por Playwright. Ábrelo o descárgalo para ver el detalle.</p>
        </div>
      </div>
    )
  }
  return (
    <div className='flex flex-col items-center justify-center gap-3 rounded-md border bg-muted/20 p-10 text-center'>
      <FileText className='size-10 text-muted-foreground' />
      <p className='text-sm text-muted-foreground'>Vista previa no disponible para este tipo de archivo.</p>
    </div>
  )
}

function StateCard({
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
    <Card>
      <CardContent className='flex flex-col items-center justify-center gap-3 py-14 text-center'>
        <Icon className={`size-10 ${destructive ? 'text-destructive' : 'text-muted-foreground'}`} />
        <div>
          <h2 className='font-medium'>{title}</h2>
          <p className={`mt-1 text-sm ${destructive ? 'text-destructive' : 'text-muted-foreground'}`}>
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

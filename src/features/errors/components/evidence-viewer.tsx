import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { EvidenceItem } from '@/types/contract'
import {
  evidenceKindLabel,
  evidenceStatusVariant,
  formatEvidenceDate,
  formatEvidenceSize,
  shortEvidenceTestId,
} from './evidence-helpers'

export function EvidenceDialog({
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
                <Badge variant='secondary'>{evidenceKindLabel(item.kind)}</Badge>
                {item.status && <Badge variant={evidenceStatusVariant(item.status)}>{item.status}</Badge>}
                <Badge variant='outline'>{item.source === 'report' ? 'reporte' : 'carpeta'}</Badge>
                {index >= 0 && total > 0 && (
                  <span className='text-xs text-muted-foreground'>{index + 1} / {total}</span>
                )}
              </div>
            </DialogHeader>

            <div className='space-y-3'>
              <div className='grid gap-2 rounded-md border bg-muted/20 p-3 text-xs sm:grid-cols-2'>
                <div><span className='text-muted-foreground'>Fecha:</span> {formatEvidenceDate(item.mtime ?? (item.timestamp ? Date.parse(item.timestamp) : null))}</div>
                <div><span className='text-muted-foreground'>Tamaño:</span> {formatEvidenceSize(item.size ?? null)}</div>
                {(item.width != null || item.height != null) && (
                  <div><span className='text-muted-foreground'>Dimensiones:</span> {item.width ?? '?'}×{item.height ?? '?'} px</div>
                )}
                <div className='truncate sm:col-span-2'><span className='text-muted-foreground'>Test:</span> <span className='font-mono' title={item.testId || ''}>{item.testId ? shortEvidenceTestId(item.testId) : '—'}</span></div>
                {(item.step || item.captureName) && (
                  <div className='truncate sm:col-span-2'><span className='text-muted-foreground'>Paso:</span> <span className='font-mono'>{item.step || item.captureName}</span></div>
                )}
                <div className='truncate sm:col-span-2'>
                  <span className='text-muted-foreground'>Origen:</span>{' '}
                  {item.evidenceSource === 'capture' ? 'captura declarada' : item.evidenceSource === 'failure-artifact' ? 'artefacto de fallo' : 'sin clasificar'}
                  {item.contentType ? ` · ${item.contentType}` : ''}
                </div>
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

              <EvidencePreview key={item.id} item={item} />

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

const ZOOM_STEPS = [1, 1.5, 2, 3] as const

export function EvidencePreview({ item }: { item: EvidenceItem }) {
  const [failed, setFailed] = useState(false)
  const [zoomIndex, setZoomIndex] = useState(0)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)
  if (item.kind === 'image') {
    if (failed) {
      return (
        <div className='flex flex-col items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-10 text-center'>
          <AlertCircle className='size-8 text-destructive' />
          <p className='text-sm text-destructive'>No se pudo cargar la imagen.</p>
        </div>
      )
    }
    const zoom = ZOOM_STEPS[zoomIndex]
    const ratioWidth = item.width || naturalSize?.width
    const ratioHeight = item.height || naturalSize?.height
    return (
      <div className='space-y-2'>
        <div className='max-h-[60vh] overflow-auto rounded-md border bg-muted/30'>
          <img
            src={item.url}
            alt={item.displayName || item.name}
            className='mx-auto block h-auto max-h-[60vh] object-contain'
            style={{
              width: `${zoom * 100}%`,
              maxWidth: 'none',
              ...(ratioWidth && ratioHeight
                ? { aspectRatio: `${ratioWidth} / ${ratioHeight}` }
                : {}),
            }}
            onLoad={(e) => {
              const image = e.currentTarget
              if (image.naturalWidth && image.naturalHeight) {
                setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight })
              }
            }}
            onError={() => setFailed(true)}
          />
        </div>
        <div className='flex items-center justify-end gap-2'>
          <span className='me-auto text-xs text-muted-foreground'>
            Zoom {Math.round(zoom * 100)}%{item.width != null && item.height != null ? ` · ${item.width}×${item.height} px` : ''}
          </span>
          <Button
            type='button'
            size='sm'
            variant='outline'
            aria-label='Reducir zoom'
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          >
            −
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            aria-label='Ampliar zoom'
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
          >
            +
          </Button>
        </div>
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

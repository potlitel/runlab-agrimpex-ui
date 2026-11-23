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
                <div className='truncate sm:col-span-2'><span className='text-muted-foreground'>Test:</span> <span className='font-mono' title={item.testId || ''}>{item.testId ? shortEvidenceTestId(item.testId) : '—'}</span></div>
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

export function EvidencePreview({ item }: { item: EvidenceItem }) {
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

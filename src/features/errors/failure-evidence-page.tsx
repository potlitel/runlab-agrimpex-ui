import { useState } from 'react'
import { AlertCircle, FolderX, ImageOff, RefreshCw } from 'lucide-react'
import { errorsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { useProfileStore } from '@/stores/profileStore'
import { useFailureEvidence } from './use-failure-evidence'

function formatDate(ms: number) {
  if (!ms) return '—'
  return new Date(ms).toLocaleString()
}

function formatSize(bytes: number) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const data = evidence.data
  const images = data?.images ?? []

  return (
    <>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight'>Evidencia de fallos</h1>
            <p className='text-sm text-muted-foreground'>
              Capturas e imágenes generadas durante las ejecuciones
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
        ) : !data?.configured ? (
          <StateCard
            icon={FolderX}
            title='Carpeta no configurada'
            description='Configura la ruta de evidencias o el proyecto para visualizar imágenes de fallos.'
          />
        ) : data.missing ? (
          <StateCard
            icon={FolderX}
            title='Carpeta no encontrada'
            description={
              data.folder
                ? `La carpeta configurada no existe: ${data.folder}`
                : 'La carpeta de evidencias no existe.'
            }
          />
        ) : images.length === 0 ? (
          <StateCard
            icon={ImageOff}
            title='Sin evidencias'
            description='No se encontraron imágenes de error en la carpeta configurada.'
          />
        ) : (
          <Card>
            <CardHeader className='border-b pb-4'>
              <div className='flex items-center justify-between gap-2'>
                <CardTitle>Galería</CardTitle>
                <Badge variant='secondary'>{images.length}</Badge>
              </div>
              {data.folder && (
                <p className='mt-1 truncate font-mono text-xs text-muted-foreground'>{data.folder}</p>
              )}
            </CardHeader>
            <CardContent className='p-4'>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {images.map((image) => (
                  <button
                    key={image.name}
                    type='button'
                    className='group overflow-hidden rounded-lg border bg-card text-start transition hover:border-primary/40 hover:shadow-sm'
                    onClick={() => evidence.openImage(image.name)}
                  >
                    <div className='aspect-video overflow-hidden bg-muted'>
                      <img
                        src={errorsApi.imageUrl(image.name)}
                        alt={image.name}
                        loading='lazy'
                        className='h-full w-full object-cover transition group-hover:scale-[1.02]'
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                    <div className='space-y-1 p-3'>
                      <p className='truncate font-mono text-xs' title={image.name}>
                        {image.name}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {formatDate(image.mtime)} · {formatSize(image.size)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </Main>

      <EvidenceDialog
        name={evidence.selectedImage}
        onClose={evidence.closeImage}
      />
    </>
  )
}

function EvidenceDialog({ name, onClose }: { name: string | null; onClose: () => void }) {
  const open = !!name

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className='sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle className='truncate pr-8 font-mono text-sm'>{name}</DialogTitle>
        </DialogHeader>
        {name ? <EvidenceDialogBody key={name} name={name} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialogBody({ name }: { name: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className='flex flex-col items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-10 text-center'>
        <AlertCircle className='size-8 text-destructive' />
        <p className='text-sm text-destructive'>No se pudo cargar la imagen seleccionada.</p>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-md border bg-muted/30'>
      <img
        src={errorsApi.imageUrl(name)}
        alt={name}
        className='max-h-[70vh] w-full object-contain'
        onError={() => setFailed(true)}
      />
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

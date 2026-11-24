import { useState } from 'react'
import { ProfileAvatar } from '@/components/profile-avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AVATAR_CANDIDATE_COUNT,
  AVATAR_STYLE_CATALOG,
  createAvatarCandidates,
  DEFAULT_AVATAR_STYLE,
  normalizeProfileAvatar,
  type AvatarStyleId,
  type ProfileAvatar as ProfileAvatarValue,
} from '@/lib/profile-avatar'
import { cn } from '@/lib/utils'

interface AvatarPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value?: ProfileAvatarValue | null
  profileId?: string
  onConfirm: (avatar: ProfileAvatarValue) => void
}

function buildCandidates(
  style: AvatarStyleId,
  current?: ProfileAvatarValue | null
): ProfileAvatarValue[] {
  const preserved = current?.style === style ? [current] : []
  return [
    ...preserved,
    ...createAvatarCandidates(style, AVATAR_CANDIDATE_COUNT - preserved.length),
  ]
}

export function AvatarPickerDialog({
  open,
  onOpenChange,
  value,
  profileId,
  onConfirm,
}: AvatarPickerDialogProps) {
  const initialStyle = value?.style ?? DEFAULT_AVATAR_STYLE
  const [style, setStyle] = useState<AvatarStyleId>(initialStyle)
  const [candidates, setCandidates] = useState<ProfileAvatarValue[]>(() =>
    buildCandidates(initialStyle, value)
  )
  const [selected, setSelected] = useState<ProfileAvatarValue | null>(value ?? null)

  const changeStyle = (next: string) => {
    const nextStyle = next as AvatarStyleId
    setStyle(nextStyle)
    setCandidates(buildCandidates(nextStyle))
    setSelected(null)
  }

  const regenerate = () => setCandidates(buildCandidates(style))

  const confirm = () => {
    if (!selected) return
    onConfirm(normalizeProfileAvatar(selected, profileId ?? 'perfil'))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Elegir avatar del perfil</DialogTitle>
          <DialogDescription>
            Selecciona una imagen, cambia el estilo o genera otros candidatos. El avatar es obligatorio.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={style} onValueChange={changeStyle}>
          <TabsList className='grid w-full grid-cols-2 sm:grid-cols-4'>
            {AVATAR_STYLE_CATALOG.map((option) => (
              <TabsTrigger key={option.id} value={option.id} title={option.description}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div
          role='group'
          aria-label='Avatares disponibles'
          className='grid max-h-80 grid-cols-4 gap-2 overflow-y-auto p-1 sm:grid-cols-6'
        >
          {candidates.map((candidate, index) => {
            const pressed = selected?.style === candidate.style && selected.seed === candidate.seed
            return (
              <button
                key={`${candidate.style}-${candidate.seed}-${index}`}
                type='button'
                aria-label={`Avatar ${index + 1}`}
                aria-pressed={pressed}
                data-seed={candidate.seed}
                data-style={candidate.style}
                onClick={() => setSelected(candidate)}
                className={cn(
                  'flex items-center justify-center rounded-lg border p-1 transition-colors hover:bg-accent',
                  pressed && 'border-primary ring-2 ring-primary/40'
                )}
              >
                <ProfileAvatar
                  name={`Avatar ${index + 1}`}
                  avatar={candidate}
                  className='size-10'
                />
              </button>
            )
          })}
        </div>

        <DialogFooter className='flex-wrap gap-2 sm:justify-between'>
          <Button type='button' variant='outline' onClick={regenerate}>
            Generar otros
          </Button>
          <div className='flex gap-2'>
            <Button type='button' variant='ghost' onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type='button' disabled={!selected} onClick={confirm}>
              Confirmar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

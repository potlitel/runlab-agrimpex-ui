import { create } from 'zustand'
import {
  createEmptySnapshot,
  type ExecutionRunState,
  type ExecutionSnapshot,
} from './execution-state'

interface ExecutionStore {
  byProfile: Record<string, ExecutionSnapshot>
  update: (profileId: string, updater: (snapshot: ExecutionSnapshot) => ExecutionSnapshot) => void
  patchRun: (profileId: string, updater: (run: ExecutionRunState) => ExecutionRunState) => void
  clear: (profileId: string) => void
}

/**
 * Estado de la corrida compartido entre `/tests` y `/`, con una entrada por perfil.
 * En vivo no se usa persistencia: el store se reinicia al recargar la aplicación.
 */
export const useExecutionStore = create<ExecutionStore>((set) => ({
  byProfile: {},
  update: (profileId, updater) =>
    set((state) => ({
      byProfile: {
        ...state.byProfile,
        [profileId]: updater(state.byProfile[profileId] ?? createEmptySnapshot()),
      },
    })),
  patchRun: (profileId, updater) =>
    set((state) => {
      const current = state.byProfile[profileId] ?? createEmptySnapshot()
      return {
        byProfile: {
          ...state.byProfile,
          [profileId]: { ...current, run: updater(current.run) },
        },
      }
    }),
  clear: (profileId) =>
    set((state) => {
      const byProfile = { ...state.byProfile }
      delete byProfile[profileId]
      return { byProfile }
    }),
}))

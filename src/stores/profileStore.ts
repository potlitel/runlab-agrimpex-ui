import { create } from 'zustand'
import type { Profile } from '@/types/contract'

interface ProfileState {
  activeProfileId: string | null
  profiles: Profile[]
  setActive: (id: string | null) => void
  setProfiles: (list: Profile[]) => void
  add: (profile: Profile) => void
}

export const profileStore = create<ProfileState>((set) => ({
  activeProfileId: null,
  profiles: [],
  setActive: (id) => set({ activeProfileId: id }),
  setProfiles: (list) =>
    set((state) => {
      const profiles = list ?? []
      let activeProfileId = state.activeProfileId
      if (activeProfileId && !profiles.some((p) => p.id === activeProfileId)) {
        activeProfileId = profiles[0]?.id ?? null
      }
      if (!activeProfileId && profiles.length > 0) {
        activeProfileId = profiles[0].id
      }
      return { profiles, activeProfileId }
    }),
  add: (profile) =>
    set((state) => {
      const exists = state.profiles.some((p) => p.id === profile.id)
      const profiles = exists
        ? state.profiles.map((p) => (p.id === profile.id ? profile : p))
        : [...state.profiles, profile]
      return {
        profiles,
        activeProfileId: state.activeProfileId ?? profile.id,
      }
    }),
}))

// Hook de conveniencia para componentes
export const useProfileStore = profileStore

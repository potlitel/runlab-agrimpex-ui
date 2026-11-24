import { create } from 'zustand'
import { normalizeProfileAvatar } from '@/lib/profile-avatar'
import type { Profile, ProfilesStatusItem } from '@/types/contract'

function withNormalizedAvatar(profile: Profile): Profile {
  return { ...profile, avatar: normalizeProfileAvatar(profile.avatar, profile.id) }
}

interface ProfileState {
  activeProfileId: string | null
  profiles: Profile[]
  statuses: ProfilesStatusItem[]
  hydrated: boolean
  loading: boolean
  error: string | null
  setActive: (id: string | null) => void
  setProfiles: (list: Profile[]) => void
  add: (profile: Profile) => void
  update: (profile: Profile) => void
  remove: (id: string) => void
  setStatuses: (statuses: ProfilesStatusItem[]) => void
  setHydrated: (hydrated: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const profileStore = create<ProfileState>((set) => ({
  activeProfileId: null,
  profiles: [],
  statuses: [],
  hydrated: false,
  loading: false,
  error: null,
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
      return { profiles: profiles.map(withNormalizedAvatar), activeProfileId }
    }),
  add: (profile) =>
    set((state) => {
      const normalized = withNormalizedAvatar(profile)
      const exists = state.profiles.some((p) => p.id === normalized.id)
      const profiles = exists
        ? state.profiles.map((p) => (p.id === normalized.id ? normalized : p))
        : [...state.profiles, normalized]
      return {
        profiles,
        activeProfileId: state.activeProfileId ?? profile.id,
      }
    }),
  update: (profile) =>
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p.id === profile.id
          ? withNormalizedAvatar({ ...p, ...profile, avatar: profile.avatar ?? p.avatar })
          : p
      ),
    })),
  remove: (id) =>
    set((state) => {
      const profiles = state.profiles.filter((p) => p.id !== id)
      return {
        profiles,
        activeProfileId:
          state.activeProfileId === id
            ? (profiles[0]?.id ?? null)
            : state.activeProfileId,
      }
    }),
  setStatuses: (statuses) => set({ statuses: statuses ?? [] }),
  setHydrated: (hydrated) => set({ hydrated }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))

// Hook de conveniencia para componentes
export const useProfileStore = profileStore

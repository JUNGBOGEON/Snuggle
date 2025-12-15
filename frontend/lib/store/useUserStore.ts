import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

interface UserStore {
    user: User | null
    isLoading: boolean
    setUser: (user: User | null) => void
    setLoading: (loading: boolean) => void
    clearUser: () => void
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ isLoading: loading }),
    clearUser: () => set({ user: null }),
}))

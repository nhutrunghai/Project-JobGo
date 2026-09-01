import { create } from 'zustand'
import { loadFavoriteIds, toggleFavoriteJob } from '../data/apiClient.js'

const emptyFavorites = () => new Set()

export const useFavoriteStore = create((set, get) => ({
  favoriteIds: emptyFavorites(),
  ownerId: '',
  isLoading: false,
  loadPromise: null,

  clear: () => set({
    favoriteIds: emptyFavorites(),
    ownerId: '',
    isLoading: false,
    loadPromise: null,
  }),

  hydrate: (ownerId, { force = false } = {}) => {
    const normalizedOwnerId = String(ownerId || '')

    if (!normalizedOwnerId) {
      get().clear()
      return Promise.resolve([])
    }

    const state = get()
    if (!force && state.ownerId === normalizedOwnerId && state.loadPromise) {
      return state.loadPromise
    }
    if (!force && state.ownerId === normalizedOwnerId && !state.isLoading) {
      return Promise.resolve(Array.from(state.favoriteIds))
    }

    const request = loadFavoriteIds()
      .then((ids) => {
        if (get().ownerId !== normalizedOwnerId) return []
        const nextIds = Array.isArray(ids) ? ids : []
        set({ favoriteIds: new Set(nextIds), isLoading: false, loadPromise: null })
        return nextIds
      })
      .catch((error) => {
        if (get().ownerId === normalizedOwnerId) {
          set({ favoriteIds: emptyFavorites(), isLoading: false, loadPromise: null })
        }
        console.error('Failed to load favorite jobs', error)
        return []
      })

    set({
      ownerId: normalizedOwnerId,
      isLoading: true,
      loadPromise: request,
    })

    return request
  },

  toggle: async (jobId) => {
    const normalizedJobId = String(jobId || '')
    if (!normalizedJobId) return false

    const previousIds = get().favoriteIds
    const shouldFavorite = !previousIds.has(normalizedJobId)
    const nextIds = new Set(previousIds)

    if (shouldFavorite) nextIds.add(normalizedJobId)
    else nextIds.delete(normalizedJobId)

    set({ favoriteIds: nextIds })

    try {
      await toggleFavoriteJob(normalizedJobId, shouldFavorite)
      return shouldFavorite
    } catch (error) {
      set({ favoriteIds: previousIds })
      throw error
    }
  },
}))

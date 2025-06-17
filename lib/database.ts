import type { User, Podcast, FactCheckResult } from "./types"

// Mock database using in-memory storage (in production, use a real database)
const users: User[] = []
const podcasts: Podcast[] = []
const factCheckResults: FactCheckResult[] = []

export const db = {
  // User operations
  users: {
    create: async (userData: Omit<User, "id" | "createdAt" | "monthlyUsage">): Promise<User> => {
      const user: User = {
        ...userData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        monthlyUsage: 0,
      }
      users.push(user)
      return user
    },

    findByEmail: async (email: string): Promise<User | null> => {
      return users.find((u) => u.email === email) || null
    },

    findById: async (id: string): Promise<User | null> => {
      return users.find((u) => u.id === id) || null
    },

    updateUsage: async (userId: string, additionalMinutes: number): Promise<void> => {
      const userIndex = users.findIndex((u) => u.id === userId)
      if (userIndex !== -1) {
        users[userIndex].monthlyUsage += additionalMinutes
      }
    },
  },

  // Podcast operations
  podcasts: {
    create: async (podcastData: Omit<Podcast, "id" | "createdAt" | "updatedAt">): Promise<Podcast> => {
      const podcast: Podcast = {
        ...podcastData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      podcasts.push(podcast)
      return podcast
    },

    findById: async (id: string): Promise<Podcast | null> => {
      return podcasts.find((p) => p.id === id) || null
    },

    findByUserId: async (userId: string): Promise<Podcast[]> => {
      return podcasts.filter((p) => p.userId === userId)
    },

    updateStatus: async (id: string, status: Podcast["status"]): Promise<void> => {
      const podcastIndex = podcasts.findIndex((p) => p.id === id)
      if (podcastIndex !== -1) {
        podcasts[podcastIndex].status = status
        podcasts[podcastIndex].updatedAt = new Date().toISOString()
      }
    },
  },

  // Fact check results operations
  factChecks: {
    create: async (resultData: Omit<FactCheckResult, "id">): Promise<FactCheckResult> => {
      const result: FactCheckResult = {
        ...resultData,
        id: Math.random().toString(36).substr(2, 9),
      }
      factCheckResults.push(result)
      return result
    },

    findByPodcastId: async (podcastId: string): Promise<FactCheckResult[]> => {
      return factCheckResults.filter((r) => r.podcastId === podcastId)
    },
  },
}

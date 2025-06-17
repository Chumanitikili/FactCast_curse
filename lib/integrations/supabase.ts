import { createClient } from "@supabase/supabase-js"

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-key"

// Client-side Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }
  return supabaseClient
}

// Server-side Supabase client with service role
export function getSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Database operations using Supabase
export const supabaseDb = {
  // User operations
  users: {
    async create(userData: {
      email: string
      name: string
      plan: string
    }) {
      const client = getSupabaseServerClient()
      const { data, error } = await client
        .from("users")
        .insert([
          {
            ...userData,
            monthly_usage: 0,
            is_active: true,
            email_verified: false,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },

    async findByEmail(email: string) {
      const client = getSupabaseServerClient()
      const { data, error } = await client.from("users").select("*").eq("email", email).eq("is_active", true).single()

      if (error && error.code !== "PGRST116") throw error
      return data
    },

    async updateUsage(userId: string, additionalMinutes: number) {
      const client = getSupabaseServerClient()
      const { error } = await client
        .from("users")
        .update({
          monthly_usage: additionalMinutes,
        })
        .eq("id", userId)

      if (error) throw error
    },
  },

  // Podcast operations
  podcasts: {
    async create(podcastData: {
      user_id: string
      title: string
      description?: string
      audio_url: string
      duration: number
    }) {
      const client = getSupabaseServerClient()
      const { data, error } = await client
        .from("podcasts")
        .insert([
          {
            ...podcastData,
            status: "uploading",
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },

    async findByUserId(userId: string) {
      const client = getSupabaseServerClient()
      const { data, error } = await client
        .from("podcasts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },

    async updateStatus(id: string, status: string) {
      const client = getSupabaseServerClient()
      const { error } = await client.from("podcasts").update({ status }).eq("id", id)

      if (error) throw error
    },
  },

  // Fact check operations
  factChecks: {
    async create(resultData: {
      podcast_id?: string
      session_id?: string
      claim: string
      verdict: string
      confidence: number
      ai_summary?: string
    }) {
      const client = getSupabaseServerClient()
      const { data, error } = await client.from("fact_check_results").insert([resultData]).select().single()

      if (error) throw error
      return data
    },

    async findByPodcastId(podcastId: string) {
      const client = getSupabaseServerClient()
      const { data, error } = await client
        .from("fact_check_results")
        .select(`
          *,
          perspectives (
            *,
            sources (*)
          )
        `)
        .eq("podcast_id", podcastId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
  },

  // Real-time subscriptions
  subscriptions: {
    subscribeToFactChecks(sessionId: string, callback: (payload: any) => void) {
      const client = getSupabaseClient()
      return client
        .channel(`fact-checks-${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "fact_check_results",
            filter: `session_id=eq.${sessionId}`,
          },
          callback,
        )
        .subscribe()
    },

    subscribeToTranscript(sessionId: string, callback: (payload: any) => void) {
      const client = getSupabaseClient()
      return client
        .channel(`transcript-${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transcript_segments",
            filter: `session_id=eq.${sessionId}`,
          },
          callback,
        )
        .subscribe()
    },
  },
}

// Authentication helpers
export const supabaseAuth = {
  async signUp(email: string, password: string, metadata?: any) {
    const client = getSupabaseClient()
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const client = getSupabaseClient()
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  async signOut() {
    const client = getSupabaseClient()
    const { error } = await client.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const client = getSupabaseClient()
    const {
      data: { user },
      error,
    } = await client.auth.getUser()
    if (error) throw error
    return user
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const client = getSupabaseClient()
    return client.auth.onAuthStateChange(callback)
  },
}

console.log("✅ Supabase integration installed and configured")

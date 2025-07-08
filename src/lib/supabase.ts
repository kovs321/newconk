import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a mock supabase client for development
const createMockSupabase = () => ({
  from: () => ({
    select: () => ({ data: [], error: new Error('Supabase not configured') }),
    insert: () => ({ error: new Error('Supabase not configured') }),
    delete: () => ({ error: new Error('Supabase not configured') }),
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
  }),
})

export const supabase = (!supabaseUrl || !supabaseAnonKey) 
  ? createMockSupabase() as any
  : createClient(supabaseUrl, supabaseAnonKey)

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Database types
export interface VotingToken {
  id: string
  symbol: string
  name: string
  contract_address: string
  votes: number
  created_at: string
  updated_at: string
}

export interface UserVote {
  id: string
  user_id: string
  token_id: string
  voted_at: string
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase environment check:', {
  url: supabaseUrl ? 'Loaded' : 'Missing',
  key: supabaseAnonKey ? 'Loaded' : 'Missing'
})

// Create a mock supabase client for development
const createMockSupabase = () => ({
  from: () => ({
    select: () => ({
      limit: () => ({ data: [], error: new Error('Supabase not configured') }),
      order: () => ({ data: [], error: new Error('Supabase not configured') }),
      eq: () => ({ data: [], error: new Error('Supabase not configured') }),
      single: () => ({ data: null, error: new Error('Supabase not configured') }),
      data: [], 
      error: new Error('Supabase not configured')
    }),
    insert: () => ({ 
      select: () => ({ data: [], error: new Error('Supabase not configured') }),
      error: new Error('Supabase not configured') 
    }),
    update: () => ({ 
      eq: () => ({ 
        select: () => ({ data: [], error: new Error('Supabase not configured') }),
        data: [], 
        error: new Error('Supabase not configured') 
      }),
      error: new Error('Supabase not configured') 
    }),
    delete: () => ({ error: new Error('Supabase not configured') }),
  }),
  channel: () => ({
    on: () => ({ 
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }) 
    }),
  }),
  rpc: () => ({ error: new Error('Supabase not configured') }),
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
  image?: string
  description?: string
}

export interface UserVote {
  id: string
  user_id: string
  token_id: string
  voted_at: string
}
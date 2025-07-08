import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
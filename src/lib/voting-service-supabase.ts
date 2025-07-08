import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { RealtimeChannel } from '@supabase/supabase-js'

type VotableToken = Database['public']['Tables']['votable_tokens']['Row']
type User = Database['public']['Tables']['users']['Row']
type UserVote = Database['public']['Tables']['user_votes']['Row']

// Create or get user by wallet address
export const createOrGetUser = async (walletAddress: string): Promise<User | null> => {
  try {
    // First try to get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (existingUser) {
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', existingUser.id)
      
      return existingUser
    }

    // Create new user if doesn't exist
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        wallet_address: walletAddress,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return null
    }

    return newUser
  } catch (error) {
    console.error('Error in createOrGetUser:', error)
    return null
  }
}

// Fetch all votable tokens
export const fetchVotableTokens = async (): Promise<VotableToken[]> => {
  try {
    const { data, error } = await supabase
      .from('votable_tokens')
      .select('*')
      .order('votes', { ascending: false })

    if (error) {
      console.error('Error fetching tokens:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchVotableTokens:', error)
    return []
  }
}

// Check if user has voted for a specific token
export const hasUserVotedForToken = async (userId: string, tokenId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_votes')
      .select('id')
      .eq('user_id', userId)
      .eq('token_id', tokenId)
      .maybeSingle() // Use maybeSingle() instead of single() to avoid 406 errors

    if (error) {
      console.error('Error checking vote:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in hasUserVotedForToken:', error)
    return false
  }
}

// Get all tokens a user has voted for
export const getUserVotedTokens = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_votes')
      .select('token_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user votes:', error)
      return []
    }

    return data?.map(vote => vote.token_id) || []
  } catch (error) {
    console.error('Error in getUserVotedTokens:', error)
    return []
  }
}

// Submit a vote using edge function for better logging
export const submitVote = async (walletAddress: string, tokenId: string): Promise<boolean> => {
  try {
    console.log('Calling submit-vote edge function...')
    
    const { data, error } = await supabase.functions.invoke('submit-vote', {
      body: {
        walletAddress,
        tokenId
      }
    })

    if (error) {
      console.error('Edge function error:', error)
      throw error
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    console.log('Vote submitted via edge function:', data)
    return true
  } catch (error) {
    console.error('Error in submitVote:', error)
    throw error
  }
}

// Subscribe to real-time voting updates
export const subscribeToVotingUpdates = (
  callback: (tokens: VotableToken[]) => void
): RealtimeChannel => {
  const channel = supabase
    .channel('voting-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votable_tokens'
      },
      async (payload) => {
        console.log('Real-time update received:', payload)
        // Fetch updated tokens
        const tokens = await fetchVotableTokens()
        callback(tokens)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_votes'
      },
      async (payload) => {
        console.log('New vote received:', payload)
        // Fetch updated tokens
        const tokens = await fetchVotableTokens()
        callback(tokens)
      }
    )
    .subscribe()

  return channel
}

// Get total vote count across all tokens
export const getTotalVoteCount = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('votable_tokens')
      .select('votes')

    if (error) {
      console.error('Error fetching total votes:', error)
      return 0
    }

    return data?.reduce((sum, token) => sum + token.votes, 0) || 0
  } catch (error) {
    console.error('Error in getTotalVoteCount:', error)
    return 0
  }
}

// Get user by wallet address
export const getUserByWallet = async (walletAddress: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Error in getUserByWallet:', error)
    return null
  }
}
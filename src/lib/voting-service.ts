import { supabase, VotingToken, UserVote } from './supabase'

// Generate a unique user ID (could be wallet address or session-based)
export const generateUserId = (): string => {
  // Check if user already has an ID in localStorage
  const existingId = localStorage.getItem('voting_user_id')
  if (existingId) return existingId
  
  // Generate new ID and store it
  const newId = crypto.randomUUID()
  localStorage.setItem('voting_user_id', newId)
  return newId
}

// Get current user ID
export const getCurrentUserId = (): string => {
  return generateUserId()
}

// Fetch all voting tokens
export const fetchVotingTokens = async (): Promise<VotingToken[]> => {
  const { data, error } = await supabase
    .from('voting_tokens')
    .select('*')
    .order('votes', { ascending: false })
  
  if (error) {
    console.error('Error fetching voting tokens:', error)
    throw error
  }
  
  return data || []
}

// Check if user has already voted for a token
export const hasUserVoted = async (tokenId: string): Promise<boolean> => {
  const userId = getCurrentUserId()
  
  const { data, error } = await supabase
    .from('user_votes')
    .select('id')
    .eq('user_id', userId)
    .eq('token_id', tokenId)
    .limit(1)
  
  if (error) {
    console.error('Error checking user vote:', error)
    return false
  }
  
  return data && data.length > 0
}

// Get all tokens user has voted for
export const getUserVotedTokens = async (): Promise<string[]> => {
  const userId = getCurrentUserId()
  
  const { data, error } = await supabase
    .from('user_votes')
    .select('token_id')
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error fetching user votes:', error)
    return []
  }
  
  return data?.map(vote => vote.token_id) || []
}

// Submit a vote
export const submitVote = async (tokenId: string): Promise<boolean> => {
  const userId = getCurrentUserId()
  
  try {
    // Check if user already voted
    const alreadyVoted = await hasUserVoted(tokenId)
    if (alreadyVoted) {
      throw new Error('User has already voted for this token')
    }
    
    // Insert vote
    const { error } = await supabase
      .from('user_votes')
      .insert([
        {
          user_id: userId,
          token_id: tokenId
        }
      ])
    
    if (error) {
      console.error('Error submitting vote:', error)
      throw error
    }
    
    return true
  } catch (error) {
    console.error('Error in submitVote:', error)
    throw error
  }
}

// Subscribe to real-time voting updates
export const subscribeToVotingUpdates = (
  callback: (tokens: VotingToken[]) => void
) => {
  const subscription = supabase
    .channel('voting_tokens_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'voting_tokens'
      },
      async () => {
        // Refresh tokens when any change occurs
        try {
          const tokens = await fetchVotingTokens()
          callback(tokens)
        } catch (error) {
          console.error('Error fetching updated tokens:', error)
        }
      }
    )
    .subscribe()
  
  return subscription
}

// Get vote count for a specific token
export const getTokenVoteCount = async (tokenId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('voting_tokens')
    .select('votes')
    .eq('id', tokenId)
    .single()
  
  if (error) {
    console.error('Error fetching vote count:', error)
    return 0
  }
  
  return data?.votes || 0
}
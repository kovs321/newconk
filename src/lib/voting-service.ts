import { supabase, VotingToken, UserVote, isSupabaseConfigured } from './supabase'

// Token addresses to vote for
const VOTING_TOKEN_ADDRESSES = [
  'Fg2Z4usj7UU99XmWV7H7EYnY2LHS7jmvA1qZ9q7nbqvQ',
  'Dkxs6nvfEqM84g1mybKL8oPWoUUawXaQNM2s2jwTbonk',
  '94cD37ipFfAcMDBgtpr5gYYXsJWfFbLruZtEW5DTbonk',
  '5ZH17JHVyYZy5QFnXyRawfj4mrieyKZihr7K88debonk',
  'DqRB2BZUfWFX8ZbCQvjWFor8KQTohaiTynSsYafbonk'
]

const SOLANA_TRACKER_API_KEY = 'ab5915df-4f94-449a-96c5-c37cbc92ef47'

// Fetch token metadata from Solana Tracker API
const fetchTokenMetadata = async (tokenAddress: string) => {
  try {
    const response = await fetch(`https://data.solanatracker.io/tokens/${tokenAddress}`, {
      headers: {
        'x-api-key': SOLANA_TRACKER_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    return {
      name: data.token.name,
      symbol: data.token.symbol,
      image: data.token.image,
      description: data.token.description || '',
    }
  } catch (error) {
    console.error(`Error fetching metadata for ${tokenAddress}:`, error)
    return {
      name: tokenAddress.slice(0, 8) + '...',
      symbol: tokenAddress.slice(0, 6),
      image: '',
      description: 'Token metadata unavailable',
    }
  }
}

// Create sample tokens with metadata
export const createSampleTokensWithMetadata = async (): Promise<VotingToken[]> => {
  const tokens = await Promise.all(
    VOTING_TOKEN_ADDRESSES.map(async (address, index) => {
      const metadata = await fetchTokenMetadata(address)
      return {
        id: `${index + 1}`,
        symbol: metadata.symbol,
        name: metadata.name,
        contract_address: address,
        votes: 0, // Start with 0 votes
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image: metadata.image,
        description: metadata.description,
      }
    })
  )
  
  return tokens
}

// Get current user ID from wallet (if connected)
export const getCurrentUserId = (walletAddress?: string): string => {
  if (walletAddress) {
    return walletAddress
  }
  
  // Fallback to localStorage for demo mode
  const existingId = localStorage.getItem('voting_user_id')
  if (existingId) return existingId
  
  // Generate new ID and store it
  const newId = crypto.randomUUID()
  localStorage.setItem('voting_user_id', newId)
  return newId
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
  
  // Fetch metadata for each token
  if (data && data.length > 0) {
    const tokensWithMetadata = await Promise.all(
      data.map(async (token) => {
        const metadata = await fetchTokenMetadata(token.contract_address)
        return {
          ...token,
          name: metadata.name || token.name,
          symbol: metadata.symbol || token.symbol,
          image: metadata.image,
          description: metadata.description
        }
      })
    )
    return tokensWithMetadata
  }
  
  return data || []
}

// Check if user has already voted for a token
export const hasUserVoted = async (tokenId: string, walletAddress?: string): Promise<boolean> => {
  const userId = getCurrentUserId(walletAddress)
  
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
export const getUserVotedTokens = async (walletAddress?: string): Promise<string[]> => {
  const userId = getCurrentUserId(walletAddress)
  
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
export const submitVote = async (tokenId: string, walletAddress?: string): Promise<boolean> => {
  const userId = getCurrentUserId(walletAddress)
  
  try {
    // Check if user already voted
    const alreadyVoted = await hasUserVoted(tokenId, walletAddress)
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
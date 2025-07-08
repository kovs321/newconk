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

// Test database connectivity
export const testDatabaseConnection = async (): Promise<void> => {
  console.log('Testing database connection...')
  
  try {
    // Test simple query
    const { data, error } = await supabase
      .from('voting_tokens')
      .select('id')
      .limit(1)
    
    console.log('Database test result:', { data, error })
    
    if (error) {
      console.error('Database connection failed:', error)
    } else {
      console.log('Database connection successful!')
    }
  } catch (err) {
    console.error('Database test error:', err)
  }
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

// Initialize voting tokens in database if they don't exist
export const initializeVotingTokens = async (): Promise<void> => {
  console.log('Checking if voting tokens exist in database...')
  
  const { data: existingTokens, error: fetchError } = await supabase
    .from('voting_tokens')
    .select('id')
  
  if (fetchError) {
    console.error('Error checking existing tokens:', fetchError)
    return
  }
  
  if (!existingTokens || existingTokens.length === 0) {
    console.log('No tokens found, initializing with sample data...')
    
    // Create tokens with metadata
    const tokensToInsert = await Promise.all(
      VOTING_TOKEN_ADDRESSES.map(async (address, index) => {
        const metadata = await fetchTokenMetadata(address)
        return {
          id: `${index + 1}`,
          symbol: metadata.symbol,
          name: metadata.name,
          contract_address: address,
          votes: 0,
          image: metadata.image,
          description: metadata.description
        }
      })
    )
    
    console.log('Inserting tokens:', tokensToInsert)
    
    const { error: insertError } = await supabase
      .from('voting_tokens')
      .insert(tokensToInsert)
    
    if (insertError) {
      console.error('Error inserting tokens:', insertError)
    } else {
      console.log('Tokens initialized successfully!')
    }
  } else {
    console.log('Tokens already exist in database:', existingTokens.length)
  }
}

// Fetch all voting tokens
export const fetchVotingTokens = async (): Promise<VotingToken[]> => {
  // Initialize tokens if needed
  await initializeVotingTokens()
  
  const { data, error } = await supabase
    .from('voting_tokens')
    .select('*')
    .order('votes', { ascending: false })
  
  if (error) {
    console.error('Error fetching voting tokens:', error)
    throw error
  }
  
  // Fetch metadata and real vote counts for each token
  if (data && data.length > 0) {
    const tokensWithMetadata = await Promise.all(
      data.map(async (token) => {
        const [metadata, realVoteCount] = await Promise.all([
          fetchTokenMetadata(token.contract_address),
          getTokenVoteCount(token.id)
        ])
        
        return {
          ...token,
          name: metadata.name || token.name,
          symbol: metadata.symbol || token.symbol,
          image: metadata.image,
          description: metadata.description,
          votes: realVoteCount // Use real vote count from user_votes table
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
    console.log('Attempting to submit vote:', { tokenId, userId, walletAddress })
    
    // Check if user already voted
    const alreadyVoted = await hasUserVoted(tokenId, walletAddress)
    console.log('User already voted check:', alreadyVoted)
    
    if (alreadyVoted) {
      throw new Error('User has already voted for this token')
    }
    
    // Insert vote
    console.log('Inserting vote into user_votes table...')
    const { data: voteData, error: voteError } = await supabase
      .from('user_votes')
      .insert([
        {
          user_id: userId,
          token_id: tokenId
        }
      ])
      .select()
    
    console.log('Vote insert result:', { voteData, voteError })
    
    if (voteError) {
      console.error('Error submitting vote:', voteError)
      throw voteError
    }
    
    // Update vote count in voting_tokens table by counting actual votes
    console.log('Getting new vote count...')
    const newVoteCount = await getTokenVoteCount(tokenId)
    console.log('New vote count:', newVoteCount)
    
    const { data: updateData, error: updateError } = await supabase
      .from('voting_tokens')
      .update({ 
        votes: newVoteCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId)
      .select()
    
    console.log('Vote count update result:', { updateData, updateError })
    
    if (updateError) {
      console.error('Error updating vote count:', updateError)
      throw updateError
    }
    
    console.log('Vote submitted successfully!')
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
  console.log('Setting up real-time subscription...')
  
  const subscription = supabase
    .channel('voting_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'voting_tokens'
      },
      async (payload) => {
        console.log('Real-time update received for voting_tokens:', payload)
        // Refresh tokens when voting_tokens table changes
        try {
          const tokens = await fetchVotingTokens()
          callback(tokens)
        } catch (error) {
          console.error('Error fetching updated tokens:', error)
        }
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
        console.log('Real-time update received for user_votes:', payload)
        // Refresh tokens when new votes are cast
        try {
          const tokens = await fetchVotingTokens()
          callback(tokens)
        } catch (error) {
          console.error('Error fetching updated tokens:', error)
        }
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status)
    })
  
  return subscription
}

// Get vote count for a specific token by counting user votes
export const getTokenVoteCount = async (tokenId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('user_votes')
    .select('id', { count: 'exact' })
    .eq('token_id', tokenId)
  
  if (error) {
    console.error('Error fetching vote count:', error)
    return 0
  }
  
  return data?.length || 0
}
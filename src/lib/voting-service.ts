import { VotingToken, UserVote } from './supabase'

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

// LocalStorage keys
const VOTES_STORAGE_KEY = 'bonk_strategy_votes'
const TOKENS_STORAGE_KEY = 'bonk_strategy_tokens'
const USER_VOTES_STORAGE_KEY = 'bonk_strategy_user_votes'

// BroadcastChannel for real-time updates across tabs
let broadcastChannel: BroadcastChannel | null = null

// Initialize BroadcastChannel if supported
if (typeof BroadcastChannel !== 'undefined') {
  broadcastChannel = new BroadcastChannel('bonk_voting_updates')
}

// Storage helpers
const getStorageItem = (key: string): any => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return null
  }
}

const setStorageItem = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error writing to localStorage:', error)
  }
}

// Broadcast update to other tabs
const broadcastUpdate = (type: string, data: any): void => {
  if (broadcastChannel) {
    try {
      const message = { type, data }
      console.log('🔄 Broadcasting update to other tabs:', message)
      broadcastChannel.postMessage(message)
    } catch (error) {
      console.error('❌ Error broadcasting update:', error)
    }
  } else {
    console.warn('❌ BroadcastChannel not available - no real-time updates')
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

// Initialize voting tokens in localStorage if they don't exist
export const initializeVotingTokens = async (): Promise<void> => {
  console.log('Checking if voting tokens exist in localStorage...')
  
  const existingTokens = getStorageItem(TOKENS_STORAGE_KEY)
  
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          image: metadata.image,
          description: metadata.description
        }
      })
    )
    
    console.log('Storing tokens in localStorage:', tokensToInsert)
    
    setStorageItem(TOKENS_STORAGE_KEY, tokensToInsert)
    
    // Initialize empty votes storage
    setStorageItem(VOTES_STORAGE_KEY, {})
    setStorageItem(USER_VOTES_STORAGE_KEY, {})
    
    console.log('Tokens initialized successfully!')
  } else {
    console.log('Tokens already exist in localStorage:', existingTokens.length)
  }
}

// Fetch all voting tokens
export const fetchVotingTokens = async (): Promise<VotingToken[]> => {
  // Initialize tokens if needed
  await initializeVotingTokens()
  
  const tokens = getStorageItem(TOKENS_STORAGE_KEY)
  
  if (!tokens || tokens.length === 0) {
    console.log('No tokens found in localStorage')
    return []
  }
  
  // Get current vote counts and update metadata
  const tokensWithVoteCounts = await Promise.all(
    tokens.map(async (token: VotingToken) => {
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
        votes: realVoteCount
      }
    })
  )
  
  // Sort by votes descending
  return tokensWithVoteCounts.sort((a, b) => b.votes - a.votes)
}

// Check if user has already voted for a token
export const hasUserVoted = async (tokenId: string, walletAddress?: string): Promise<boolean> => {
  const userId = getCurrentUserId(walletAddress)
  const userVotes = getStorageItem(USER_VOTES_STORAGE_KEY) || {}
  
  return userVotes[userId] && userVotes[userId].includes(tokenId)
}

// Get all tokens user has voted for
export const getUserVotedTokens = async (walletAddress?: string): Promise<string[]> => {
  const userId = getCurrentUserId(walletAddress)
  const userVotes = getStorageItem(USER_VOTES_STORAGE_KEY) || {}
  
  return userVotes[userId] || []
}

// Submit a vote
export const submitVote = async (tokenId: string, walletAddress?: string): Promise<boolean> => {
  const userId = getCurrentUserId(walletAddress)
  
  try {
    console.log('Attempting to submit vote:', { tokenId, userId: userId.substring(0, 10) + '...' })
    
    // Check if user already voted
    const alreadyVoted = await hasUserVoted(tokenId, walletAddress)
    console.log('User already voted check:', alreadyVoted)
    
    if (alreadyVoted) {
      throw new Error('User has already voted for this token')
    }
    
    // Get current user votes
    const userVotes = getStorageItem(USER_VOTES_STORAGE_KEY) || {}
    
    // Add this vote to user's votes
    if (!userVotes[userId]) {
      userVotes[userId] = []
    }
    userVotes[userId].push(tokenId)
    
    // Save updated user votes
    setStorageItem(USER_VOTES_STORAGE_KEY, userVotes)
    
    // Get all votes for counting
    const allVotes = getStorageItem(VOTES_STORAGE_KEY) || {}
    
    // Increment vote count for this token
    allVotes[tokenId] = (allVotes[tokenId] || 0) + 1
    
    // Save updated vote counts
    setStorageItem(VOTES_STORAGE_KEY, allVotes)
    
    console.log('Vote submitted successfully to localStorage!')
    
    // Broadcast update to other tabs (send only primitive data)
    const voteCount = allVotes[tokenId]
    broadcastUpdate('vote_submitted', { 
      tokenId: String(tokenId), 
      newVoteCount: Number(voteCount),
      timestamp: Date.now()
    })
    
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
  console.log('Setting up real-time subscription with BroadcastChannel...')
  
  if (!broadcastChannel) {
    console.warn('BroadcastChannel not supported, real-time updates disabled')
    return { unsubscribe: () => {} }
  }
  
  const handleMessage = async (event: MessageEvent) => {
    console.log('📨 Real-time update received in tab:', event.data)
    
    if (event.data.type === 'vote_submitted') {
      console.log('🗳️ Vote update received, refreshing tokens...')
      // Refresh tokens when votes are cast
      try {
        const tokens = await fetchVotingTokens()
        console.log('✅ Tokens refreshed successfully:', tokens.length)
        callback(tokens)
      } catch (error) {
        console.error('Error fetching updated tokens:', error)
      }
    }
  }
  
  broadcastChannel.addEventListener('message', handleMessage)
  
  return {
    unsubscribe: () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleMessage)
      }
    }
  }
}

// Get vote count for a specific token
export const getTokenVoteCount = async (tokenId: string): Promise<number> => {
  const allVotes = getStorageItem(VOTES_STORAGE_KEY) || {}
  return allVotes[tokenId] || 0
}

// Test function to simulate a vote (for console testing)
export const testVote = async (tokenId: string = '1') => {
  console.log('🧪 Testing vote for token:', tokenId)
  try {
    const testUserId = 'test-user-' + Date.now()
    await submitVote(tokenId, testUserId)
    console.log('✅ Test vote successful!')
    return true
  } catch (error) {
    console.error('❌ Test vote failed:', error)
    return false
  }
}

// Simple test function for BroadcastChannel
export const testBroadcast = () => {
  console.log('🧪 Testing BroadcastChannel...')
  if (broadcastChannel) {
    console.log('✅ BroadcastChannel available')
    try {
      broadcastChannel.postMessage({ 
        type: 'test', 
        data: { message: 'hello', timestamp: Date.now() } 
      })
      console.log('✅ Test message sent')
    } catch (error) {
      console.error('❌ Error sending test message:', error)
    }
  } else {
    console.error('❌ BroadcastChannel not available')
  }
}

// Export for console access
if (typeof window !== 'undefined') {
  (window as any).testVote = testVote
  (window as any).testBroadcast = testBroadcast
  (window as any).getVotes = () => getStorageItem(VOTES_STORAGE_KEY)
  (window as any).clearVotes = () => {
    localStorage.removeItem(VOTES_STORAGE_KEY)
    localStorage.removeItem(USER_VOTES_STORAGE_KEY)
    localStorage.removeItem(TOKENS_STORAGE_KEY)
    console.log('🗑️ All votes cleared!')
  }
}
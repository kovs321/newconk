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

// Simple in-memory storage for voting (fallback)
let inMemoryVotes: { [key: string]: number } = {}
let inMemoryUserVotes: { [key: string]: string[] } = {}

// Initialize simple storage
const initializeSimpleStorage = () => {
  console.log('🔄 Initializing simple voting storage...')
  inMemoryVotes = {}
  inMemoryUserVotes = {}
}

// Simple storage helpers (in-memory fallback)
const getStorageItem = (key: string): any => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      // Use in-memory storage
      if (key === VOTES_STORAGE_KEY) return inMemoryVotes
      if (key === USER_VOTES_STORAGE_KEY) return inMemoryUserVotes
      return null
    }
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error('Error reading from localStorage, using in-memory:', error)
    if (key === VOTES_STORAGE_KEY) return inMemoryVotes
    if (key === USER_VOTES_STORAGE_KEY) return inMemoryUserVotes
    return null
  }
}

const setStorageItem = (key: string, value: any): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      // Use in-memory storage
      if (key === VOTES_STORAGE_KEY) inMemoryVotes = value
      if (key === USER_VOTES_STORAGE_KEY) inMemoryUserVotes = value
      return
    }
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error writing to localStorage, using in-memory:', error)
    if (key === VOTES_STORAGE_KEY) inMemoryVotes = value
    if (key === USER_VOTES_STORAGE_KEY) inMemoryUserVotes = value
  }
}

// Get current user ID from wallet (if connected)
export const getCurrentUserId = (walletAddress?: string): string => {
  if (walletAddress) {
    return walletAddress
  }
  
  // Fallback to localStorage for demo mode
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const existingId = localStorage.getItem('voting_user_id')
      if (existingId) return existingId
      
      // Generate new ID and store it
      const newId = crypto.randomUUID()
      localStorage.setItem('voting_user_id', newId)
      return newId
    } catch (error) {
      console.error('Error with localStorage for user ID:', error)
    }
  }
  
  // Final fallback if localStorage is not available
  return 'anonymous-user-' + Date.now()
}

// Initialize voting tokens in localStorage if they don't exist
export const initializeVotingTokens = async (): Promise<void> => {
  try {
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
  } catch (error) {
    console.error('Error initializing voting tokens:', error)
    // Don't throw error, just log it
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

// Check if wallet has already voted for a token
export const hasWalletVoted = async (tokenId: string, walletAddress: string): Promise<boolean> => {
  const userVotes = getStorageItem(USER_VOTES_STORAGE_KEY) || {}
  
  // Check if this specific wallet address has voted for this token
  return userVotes[walletAddress] && userVotes[walletAddress].includes(tokenId)
}

// Legacy function for backward compatibility
export const hasUserVoted = async (tokenId: string, walletAddress?: string): Promise<boolean> => {
  if (!walletAddress) {
    return false // If no wallet connected, they haven't voted
  }
  return hasWalletVoted(tokenId, walletAddress)
}

// Get all tokens a wallet has voted for
export const getWalletVotedTokens = async (walletAddress: string): Promise<string[]> => {
  const userVotes = getStorageItem(USER_VOTES_STORAGE_KEY) || {}
  
  // Return tokens this specific wallet has voted for
  return userVotes[walletAddress] || []
}

// Legacy function for backward compatibility
export const getUserVotedTokens = async (walletAddress?: string): Promise<string[]> => {
  if (!walletAddress) {
    return [] // If no wallet connected, they haven't voted for anything
  }
  return getWalletVotedTokens(walletAddress)
}

// Submit a vote (requires wallet connection)
export const submitVote = async (tokenId: string, walletAddress?: string): Promise<boolean> => {
  try {
    // 1. Check if wallet is connected
    if (!walletAddress) {
      throw new Error('Phantom wallet must be connected to vote')
    }
    
    console.log('Attempting to submit vote:', { 
      tokenId, 
      walletAddress: walletAddress.substring(0, 8) + '...' 
    })
    
    // 2. Check if this wallet has already voted on this token
    const alreadyVoted = await hasWalletVoted(tokenId, walletAddress)
    console.log('Wallet already voted check:', alreadyVoted)
    
    if (alreadyVoted) {
      throw new Error('You have already voted on this token')
    }
    
    // 3. Get current wallet votes from storage
    const userVotes = getStorageItem(USER_VOTES_STORAGE_KEY) || {}
    
    // 4. Add this vote to wallet's voting record
    if (!userVotes[walletAddress]) {
      userVotes[walletAddress] = []
    }
    userVotes[walletAddress].push(tokenId)
    
    // 5. Save updated wallet voting records
    setStorageItem(USER_VOTES_STORAGE_KEY, userVotes)
    
    // 6. Get all votes for counting
    const allVotes = getStorageItem(VOTES_STORAGE_KEY) || {}
    
    // 7. Increment vote count for this token
    allVotes[tokenId] = (allVotes[tokenId] || 0) + 1
    
    // 8. Save updated vote counts
    setStorageItem(VOTES_STORAGE_KEY, allVotes)
    
    console.log('✅ Vote submitted successfully! Wallet:', walletAddress.substring(0, 8) + '...')
    
    return true
  } catch (error) {
    console.error('❌ Error in submitVote:', error)
    throw error
  }
}

// Subscribe to voting updates (simplified)
export const subscribeToVotingUpdates = (
  callback: (tokens: VotingToken[]) => void
) => {
  console.log('Setting up simple voting subscription...')
  
  // For now, just return a dummy subscription
  // Real-time updates will be handled by the UI refresh after voting
  return {
    unsubscribe: () => {
      console.log('Unsubscribed from voting updates')
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

// Export for console access
if (typeof window !== 'undefined') {
  (window as any).testVote = testVote
  (window as any).getVotes = () => getStorageItem(VOTES_STORAGE_KEY)
  (window as any).getWalletVotes = () => getStorageItem(USER_VOTES_STORAGE_KEY)
  (window as any).clearVotes = () => {
    try {
      localStorage.removeItem(VOTES_STORAGE_KEY)
      localStorage.removeItem(USER_VOTES_STORAGE_KEY)
      localStorage.removeItem(TOKENS_STORAGE_KEY)
      console.log('🗑️ All votes cleared!')
    } catch (error) {
      console.log('🗑️ Memory votes cleared!')
      inMemoryVotes = {}
      inMemoryUserVotes = {}
    }
  }
  
  // Helper function to show voting logic
  (window as any).showVotingLogic = () => {
    console.log(`
🗳️ BONK STRATEGY Voting Logic:

1. Connect Phantom Wallet:
   - User clicks "Connect Wallet" button
   - Phantom wallet connection established
   - Get wallet's public address

2. Voting Restriction Logic:
   - For each token, track which wallet addresses have voted
   - When user votes:
     ✅ Check if current wallet has already voted on this token
     ✅ If not voted: Allow vote + record wallet address
     ❌ If already voted: Block vote + show "You have already voted"

3. Storage (Front-End):
   - Store wallet voting records in localStorage
   - Format: { "walletAddress": ["token1", "token2"], ... }
   - Note: Only prevents double voting in same browser

4. Test Commands:
   - testVote('1') - Test vote for token 1
   - getVotes() - See vote counts
   - getWalletVotes() - See which wallets voted for what
   - clearVotes() - Clear all votes
    `)
  }
}
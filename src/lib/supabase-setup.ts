import { supabase } from './supabase'

// Test database connection
export const testConnection = async () => {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    const { data, error } = await supabase.from('voting_tokens').select('count', { count: 'exact' })
    
    if (error) {
      console.error('❌ Connection test failed:', error)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

// Check if tables exist by trying to query them
export const checkTablesExist = async () => {
  console.log('📋 Checking if tables exist...')
  
  try {
    // Try to query voting_tokens table
    const { error: votingError } = await supabase
      .from('voting_tokens')
      .select('id')
      .limit(1)
    
    // Try to query user_votes table  
    const { error: votesError } = await supabase
      .from('user_votes')
      .select('id')
      .limit(1)
    
    if (votingError || votesError) {
      console.log('❌ Tables do not exist or are not accessible')
      return false
    }
    
    console.log('✅ Tables exist and are accessible')
    return true
  } catch (error) {
    console.error('❌ Error checking tables:', error)
    return false
  }
}

// Insert sample BONK tokens
export const insertSampleTokens = async () => {
  console.log('🪙 Inserting sample BONK tokens...')
  
  const sampleTokens = [
    {
      symbol: 'BONK',
      name: 'Bonk Token',
      contract_address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
    },
    {
      symbol: 'SAMO',
      name: 'Samoyedcoin',
      contract_address: 'X6y9bV1V5pMKGfXVwWy1xq1m9xGxJrAFrQQWbGfkSuq'
    },
    {
      symbol: 'WIF',
      name: 'Dogwifhat',
      contract_address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'
    },
    {
      symbol: 'POPCAT',
      name: 'Popcat Token',
      contract_address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKZNqJ8YoWKpQqZs'
    },
    {
      symbol: 'PNUT',
      name: 'Peanut Token',
      contract_address: 'pnuTzKNjkgTCKZhcUYJZ6tQFaYSBKZNqJ8YoWKpQqZs'
    }
  ]

  try {
    // Check if tokens already exist
    const { data: existingTokens } = await supabase
      .from('voting_tokens')
      .select('symbol')
    
    const existingSymbols = existingTokens?.map(t => t.symbol) || []
    const newTokens = sampleTokens.filter(token => !existingSymbols.includes(token.symbol))
    
    if (newTokens.length > 0) {
      const { error } = await supabase
        .from('voting_tokens')
        .insert(newTokens)
      
      if (error) {
        console.error('Error inserting tokens:', error)
        return false
      }
      
      console.log(`✅ Inserted ${newTokens.length} new tokens`)
    } else {
      console.log('✅ Sample tokens already exist')
    }
    
    return true
  } catch (error) {
    console.error('❌ Error inserting sample tokens:', error)
    return false
  }
}

// Main setup function
export const initializeSupabase = async () => {
  console.log('🔧 Initializing Supabase database...')
  
  const dbSetup = await setupDatabase()
  if (!dbSetup) {
    console.error('❌ Failed to set up database')
    return false
  }
  
  const tokensSetup = await insertSampleTokens()
  if (!tokensSetup) {
    console.error('❌ Failed to insert sample tokens')
    return false
  }
  
  console.log('🎉 Supabase initialization completed successfully!')
  return true
}

// Custom tokens insertion function
export const insertCustomTokens = async (tokens: Array<{
  symbol: string
  name: string
  contract_address: string
}>) => {
  console.log(`🪙 Inserting ${tokens.length} custom tokens...`)
  
  try {
    const { error } = await supabase
      .from('voting_tokens')
      .insert(tokens)
    
    if (error) {
      console.error('Error inserting custom tokens:', error)
      return false
    }
    
    console.log(`✅ Successfully inserted ${tokens.length} custom tokens`)
    return true
  } catch (error) {
    console.error('❌ Error inserting custom tokens:', error)
    return false
  }
}

// Reset database function (for testing)
export const resetDatabase = async () => {
  console.log('🔄 Resetting database...')
  
  try {
    // Clear existing data
    await supabase.from('user_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('voting_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Re-insert sample tokens
    await insertSampleTokens()
    
    console.log('✅ Database reset completed')
    return true
  } catch (error) {
    console.error('❌ Error resetting database:', error)
    return false
  }
}

import { supabase } from "@/integrations/supabase/client";

export interface VotingToken {
  id: string;
  symbol: string;
  name: string;
  contract_address: string;
  votes: number;
  created_at: string;
  updated_at: string;
  image?: string;
  description?: string;
}

export interface UserVote {
  id: string;
  user_id: string;
  token_id: string;
  voted_at: string;
}

const SOLANA_TRACKER_API_KEY = 'ab5915df-4f94-449a-96c5-c37cbc92ef47';

// Fetch token metadata from Solana Tracker API
const fetchTokenMetadata = async (tokenAddress: string) => {
  try {
    const response = await fetch(`https://data.solanatracker.io/tokens/${tokenAddress}`, {
      headers: {
        'x-api-key': SOLANA_TRACKER_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      name: data.token.name,
      symbol: data.token.symbol,
      image: data.token.image,
      description: data.token.description || '',
    };
  } catch (error) {
    console.error(`Error fetching metadata for ${tokenAddress}:`, error);
    return {
      name: tokenAddress.slice(0, 8) + '...',
      symbol: tokenAddress.slice(0, 6),
      image: '',
      description: 'Token metadata unavailable',
    };
  }
};

// Get current user ID (for demo purposes, using localStorage)
export const getCurrentUserId = (): string => {
  const existingId = localStorage.getItem('voting_user_id');
  if (existingId) return existingId;
  
  const newId = crypto.randomUUID();
  localStorage.setItem('voting_user_id', newId);
  return newId;
};

// Fetch all voting tokens with enhanced metadata
export const fetchVotingTokens = async (): Promise<VotingToken[]> => {
  const { data, error } = await supabase
    .from('voting_tokens')
    .select('*')
    .order('votes', { ascending: false });
  
  if (error) {
    console.error('Error fetching voting tokens:', error);
    throw error;
  }

  // Enhance with real token metadata
  const enhancedTokens = await Promise.all(
    (data || []).map(async (token) => {
      const metadata = await fetchTokenMetadata(token.contract_address);
      return {
        ...token,
        name: metadata.name,
        symbol: metadata.symbol,
        image: metadata.image,
        description: metadata.description,
        votes: token.votes || 0,
      };
    })
  );
  
  return enhancedTokens;
};

// Check if user has already voted for a token
export const hasUserVoted = async (tokenId: string): Promise<boolean> => {
  const userId = getCurrentUserId();
  
  const { data, error } = await supabase
    .from('user_votes')
    .select('id')
    .eq('user_id', userId)
    .eq('token_id', tokenId)
    .limit(1);
  
  if (error) {
    console.error('Error checking user vote:', error);
    return false;
  }
  
  return data && data.length > 0;
};

// Get all tokens user has voted for
export const getUserVotedTokens = async (): Promise<string[]> => {
  const userId = getCurrentUserId();
  
  const { data, error } = await supabase
    .from('user_votes')
    .select('token_id')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user votes:', error);
    return [];
  }
  
  return data?.map(vote => vote.token_id) || [];
};

// Submit a vote
export const submitVote = async (tokenId: string): Promise<boolean> => {
  const userId = getCurrentUserId();
  
  try {
    // Check if user already voted
    const alreadyVoted = await hasUserVoted(tokenId);
    if (alreadyVoted) {
      throw new Error('User has already voted for this token');
    }
    
    // Insert vote
    const { error } = await supabase
      .from('user_votes')
      .insert([
        {
          user_id: userId,
          token_id: tokenId
        }
      ]);
    
    if (error) {
      console.error('Error submitting vote:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in submitVote:', error);
    throw error;
  }
};

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
        try {
          const tokens = await fetchVotingTokens();
          callback(tokens);
        } catch (error) {
          console.error('Error fetching updated tokens:', error);
        }
      }
    )
    .subscribe();
  
  return subscription;
};

import React, { useState, useEffect } from 'react';
import { 
  fetchVotableTokens, 
  submitVote, 
  getUserVotedTokens, 
  subscribeToVotingUpdates,
  getUserByWallet,
  createOrGetUser
} from '../lib/voting-service-supabase';
import { Database } from '@/integrations/supabase/types';
import { useWallet } from '@solana/wallet-adapter-react';

type VotableToken = Database['public']['Tables']['votable_tokens']['Row'];

interface VotingItem extends VotableToken {
  userVoted?: boolean;
}

const VotingPanel = () => {
  const { connected, publicKey } = useWallet();
  const [votingItems, setVotingItems] = useState<VotingItem[]>([]);
  const [userVotedTokens, setUserVotedTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingStates, setVotingStates] = useState<{ [key: string]: boolean }>({});
  
  const VOTE_GOAL = 25;
  const SOLANA_TRACKER_API_KEY = 'ab5915df-4f94-449a-96c5-c37cbc92ef47';

  // Fetch token metadata from Solana Tracker API
  const fetchTokenMetadata = async (contractAddress: string): Promise<{name: string, symbol: string, image?: string} | null> => {
    try {
      console.log(`🔍 Fetching voting token metadata for: ${contractAddress}`);
      
      const response = await fetch(
        `https://data.solanatracker.io/tokens/${contractAddress}`,
        {
          headers: {
            'x-api-key': SOLANA_TRACKER_API_KEY,
          },
        }
      );

      if (!response.ok) {
        console.log(`❌ API Error for ${contractAddress}: ${response.status}`);
        return null;
      }

      const result = await response.json();
      const tokenData = result.token;
      
      if (!tokenData) {
        console.log(`⚠️ No token data found for ${contractAddress}`);
        return null;
      }

      const metadata = {
        name: tokenData.name || 'Unknown Token',
        symbol: tokenData.symbol || 'UNKNOWN',
        image: tokenData.image
      };

      console.log(`✅ Fetched voting token metadata for ${contractAddress}:`, metadata);
      return metadata;
    } catch (err) {
      console.error(`💥 Error fetching voting token metadata for ${contractAddress}:`, err);
      return null;
    }
  };

  // Enhance tokens with fresh metadata
  const enhanceTokensWithMetadata = async (tokens: VotableToken[]): Promise<VotingItem[]> => {
    const enhancedTokens = await Promise.all(
      tokens.map(async (token) => {
        // Try to fetch fresh metadata from API
        const apiMetadata = await fetchTokenMetadata(token.contract_address);
        
        if (apiMetadata) {
          // Use API metadata if available
          return {
            ...token,
            name: apiMetadata.name,
            symbol: apiMetadata.symbol,
            image: apiMetadata.image || token.image_url
          };
        }
        
        // Fallback to database values, mapping field names correctly
        return {
          ...token,
          symbol: token.ticker, // Map ticker to symbol
          image: token.image_url // Map image_url to image
        };
      })
    );

    return enhancedTokens as VotingItem[];
  };

  // Load initial data
  useEffect(() => {
    const loadVotingData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading voting data from Supabase...');
        
        // Fetch tokens first
        const tokens = await fetchVotableTokens();
        console.log('Tokens from Supabase:', tokens);
        
        // Enhance tokens with fresh metadata
        const enhancedTokens = await enhanceTokensWithMetadata(tokens);
        console.log('Enhanced tokens with metadata:', enhancedTokens);
        
        // If wallet is connected, create/get user and their votes
        let userVotes: string[] = [];
        if (connected && publicKey) {
          const walletAddress = publicKey.toString();
          console.log('Wallet connected, creating/getting user:', walletAddress);
          
          // Create or get user in database
          const user = await createOrGetUser(walletAddress);
          if (user) {
            console.log('User created/found:', user.id);
            userVotes = await getUserVotedTokens(user.id);
          } else {
            console.error('Failed to create/get user');
          }
        }
        
        // Mark tokens that user has voted for
        const tokensWithVoteStatus = enhancedTokens.map(token => ({
          ...token,
          userVoted: userVotes.includes(token.id)
        }));
        
        setVotingItems(tokensWithVoteStatus);
        setUserVotedTokens(userVotes);
      } catch (err) {
        console.error('Error loading voting data:', err);
        setError('Failed to load voting data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadVotingData();
  }, [connected, publicKey]);

  // Set up real-time subscription
  useEffect(() => {
    console.log('🔄 Setting up real-time subscription...');
    const channel = subscribeToVotingUpdates(async (updatedTokens) => {
      try {
        console.log('📨 Real-time update received! Updated tokens:', updatedTokens);
        
        // Enhance updated tokens with metadata
        const enhancedUpdatedTokens = await enhanceTokensWithMetadata(updatedTokens);
        
        // Refresh user votes to maintain accurate state
        let userVotes: string[] = [];
        if (connected && publicKey) {
          const walletAddress = publicKey.toString();
          const user = await getUserByWallet(walletAddress);
          if (user) {
            userVotes = await getUserVotedTokens(user.id);
          }
        }
        
        const tokensWithVoteStatus = enhancedUpdatedTokens.map(token => ({
          ...token,
          userVoted: userVotes.includes(token.id)
        }));
        
        console.log('🔄 Updating UI with new vote counts...');
        setVotingItems(tokensWithVoteStatus);
        setUserVotedTokens(userVotes);
      } catch (err) {
        console.error('Error updating tokens:', err);
      }
    });

    return () => {
      console.log('🔌 Unsubscribing from real-time updates');
      channel.unsubscribe();
    };
  }, [connected, publicKey]);

  const handleVote = async (tokenId: string) => {
    if (votingStates[tokenId]) return; // Prevent double clicking
    
    // 1. Check if Phantom wallet is connected
    if (!connected || !publicKey) {
      setError('Please connect your Phantom wallet to vote.');
      return;
    }
    
    const walletAddress = publicKey.toString();
    
    try {
      setVotingStates(prev => ({ ...prev, [tokenId]: true }));
      setError(null);
      
      console.log('🗳️ Voting attempt:', { tokenId, walletAddress: walletAddress.substring(0, 8) + '...' });
      
      // 2. Submit vote with wallet address (Supabase will handle user creation/authentication)
      await submitVote(walletAddress, tokenId);
      
      // 3. Only update the userVoted flag locally (the vote count will update via real-time subscription)
      setVotingItems(prev => 
        prev.map(item => 
          item.id === tokenId 
            ? { ...item, userVoted: true }  // Only mark as voted, don't change vote count
            : item
        )
      );
      
      setUserVotedTokens(prev => [...prev, tokenId]);
      
      console.log('✅ Vote successful for token:', tokenId);
      console.log('⏳ Waiting for real-time update to show new vote count...');
      
    } catch (err: any) {
      console.error('❌ Error voting:', err);
      
      // Show specific error messages
      if (err.message.includes('already voted')) {
        setError('You have already voted on this token with your current wallet.');
      } else if (err.message.includes('wallet must be connected')) {
        setError('Please connect your Phantom wallet to vote.');
      } else {
        setError(err.message || 'Failed to submit vote. Please try again.');
      }
    } finally {
      setVotingStates(prev => ({ ...prev, [tokenId]: false }));
    }
  };

  // Calculate total votes for percentage calculation
  const totalVotes = votingItems.reduce((sum, item) => sum + item.votes, 0);
  
  console.log('VotingPanel - items loaded:', votingItems.length, votingItems);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading voting data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Live Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium text-gray-600">Live Voting</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {totalVotes} total votes
          </div>
          <button
            onClick={async () => {
              console.log('🔄 Manual refresh triggered');
              const tokens = await fetchVotableTokens();
              const enhancedTokens = await enhanceTokensWithMetadata(tokens);
              let userVotes: string[] = [];
              if (connected && publicKey) {
                const walletAddress = publicKey.toString();
                const user = await getUserByWallet(walletAddress);
                if (user) {
                  userVotes = await getUserVotedTokens(user.id);
                }
              }
              const tokensWithVoteStatus = enhancedTokens.map(token => ({
                ...token,
                userVoted: userVotes.includes(token.id)
              }));
              setVotingItems(tokensWithVoteStatus);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Voting Items */}
      {votingItems.map((item) => {
        const percentage = (item.votes / VOTE_GOAL) * 100;
        const isVoting = votingStates[item.id];
        const isGoalReached = item.votes >= VOTE_GOAL;
        
        return (
          <div key={item.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span 
                    className="text-orange-600 font-bold text-sm flex items-center justify-center w-full h-full"
                    style={{ display: item.image ? 'none' : 'flex' }}
                  >
                    {item.symbol}
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">{item.symbol}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.contract_address.slice(0, 8)}...{item.contract_address.slice(-6)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{item.votes}/{VOTE_GOAL}</p>
                <p className="text-sm text-gray-500">votes</p>
                {isGoalReached && (
                  <span className="text-xs text-green-600 font-medium">✓ Goal Reached!</span>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress to Goal</span>
                <span className="text-sm font-medium text-gray-700">{Math.min(percentage, 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isGoalReached ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <button
              onClick={() => handleVote(item.id)}
              disabled={item.userVoted || isVoting || !connected}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                item.userVoted
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : isVoting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : !connected
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {item.userVoted ? '✓ Voted' : 
               isVoting ? 'Voting...' : 
               !connected ? 'Connect Wallet to Vote' : 'Vote'}
            </button>
          </div>
        );
      })}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        One vote per wallet address per token • Real-time voting powered by Supabase
      </div>
    </div>
  );
};

export default VotingPanel;
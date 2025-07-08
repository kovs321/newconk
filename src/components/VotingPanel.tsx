import React, { useState, useEffect } from 'react';
import { VotingToken, isSupabaseConfigured } from '../lib/supabase';
import { 
  fetchVotingTokens, 
  submitVote, 
  getUserVotedTokens, 
  subscribeToVotingUpdates 
} from '../lib/voting-service';

// Safe wallet imports with error handling
let useWallet: any;

try {
  const walletAdapter = require('@solana/wallet-adapter-react');
  useWallet = walletAdapter.useWallet;
} catch (e) {
  console.warn('Wallet adapter not available, using fallback');
  const { useWalletFallback } = require('./WalletFallback');
  useWallet = useWalletFallback;
}

interface VotingItem extends VotingToken {
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

  // Load initial data
  useEffect(() => {
    const loadVotingData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If Supabase is not configured, show sample data with real metadata
        if (!isSupabaseConfigured) {
          console.log('Supabase not configured, fetching token metadata for demo...');
          const { createSampleTokensWithMetadata } = await import('../lib/voting-service');
          const sampleTokens = await createSampleTokensWithMetadata();
          
          const tokensWithVoteStatus = sampleTokens.map(token => ({
            ...token,
            userVoted: false
          }));
          
          setVotingItems(tokensWithVoteStatus);
          setUserVotedTokens([]);
          // setError('Demo mode: Supabase not configured. Votes will not be saved.');
          setLoading(false);
          return;
        }
        
        // Fetch tokens and user votes simultaneously
        const walletAddress = publicKey?.toString()
        const [tokens, userVotes] = await Promise.all([
          fetchVotingTokens(),
          getUserVotedTokens(walletAddress)
        ]);
        
        // Mark tokens that user has voted for
        const tokensWithVoteStatus = tokens.map(token => ({
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
    // Skip real-time subscription if Supabase is not configured
    if (!isSupabaseConfigured) {
      return;
    }

    const subscription = subscribeToVotingUpdates(async (updatedTokens) => {
      try {
        // Refresh user votes to maintain accurate state
        const walletAddress = publicKey?.toString()
        const userVotes = await getUserVotedTokens(walletAddress);
        
        const tokensWithVoteStatus = updatedTokens.map(token => ({
          ...token,
          userVoted: userVotes.includes(token.id)
        }));
        
        setVotingItems(tokensWithVoteStatus);
        setUserVotedTokens(userVotes);
      } catch (err) {
        console.error('Error updating tokens:', err);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleVote = async (tokenId: string) => {
    if (votingStates[tokenId]) return; // Prevent double clicking
    
    // Check if wallet is connected
    if (!connected) {
      setError('Please connect your Phantom wallet to vote.');
      return;
    }
    
    try {
      setVotingStates(prev => ({ ...prev, [tokenId]: true }));
      setError(null);
      
      const walletAddress = publicKey?.toString()
      
      // If Supabase is not configured, just update local state
      if (!isSupabaseConfigured) {
        // Update local state immediately for demo
        setVotingItems(prev => 
          prev.map(item => 
            item.id === tokenId 
              ? { ...item, votes: item.votes + 1, userVoted: true }
              : item
          )
        );
        
        setUserVotedTokens(prev => [...prev, tokenId]);
        return;
      }
      
      await submitVote(tokenId, walletAddress);
      
      // Update local state immediately for better UX
      setVotingItems(prev => 
        prev.map(item => 
          item.id === tokenId 
            ? { ...item, votes: item.votes + 1, userVoted: true }
            : item
        )
      );
      
      setUserVotedTokens(prev => [...prev, tokenId]);
      
    } catch (err: any) {
      console.error('Error voting:', err);
      setError(err.message || 'Failed to submit vote. Please try again.');
    } finally {
      setVotingStates(prev => ({ ...prev, [tokenId]: false }));
    }
  };

  // Calculate total votes for percentage calculation
  const totalVotes = votingItems.reduce((sum, item) => sum + item.votes, 0);

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
        <div className="text-sm text-gray-500">
          {totalVotes} total votes
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
        Votes are stored securely and updated in real-time
      </div>
    </div>
  );
};

export default VotingPanel;
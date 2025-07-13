import React, { useState } from 'react';
import DecryptedText from './DecryptedText';

interface Token {
  token: {
    name: string;
    symbol: string;
    mint: string;
    image?: string;
    decimals: number;
  };
  balance: number;
  value: number;
}

interface WalletResponse {
  tokens: Token[];
  total: number;
  totalSol: number;
  timestamp: string;
}

const WalletEligibilityChecker: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    isEligible: boolean;
    ikunBalance: number;
    ikunValue: number;
    error?: string;
  } | null>(null);

  const SOLANA_TRACKER_API_KEY = '4be0cb55-c2d4-4fdc-a15d-75a14e5c0029';
  const IKUN_TOKEN_MINT = 'AtortPA9SVbkKmdzu5zg4jxgkR4howvPshorA9jYbonk';
  const MINIMUM_TOKENS = 100000;

  const checkWalletEligibility = async () => {
    if (!walletAddress.trim()) {
      setResult({ isEligible: false, ikunBalance: 0, ikunValue: 0, error: 'Please enter a wallet address' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('Checking wallet eligibility for:', walletAddress);
      
      const response = await fetch(
        `https://data.solanatracker.io/wallet/${walletAddress.trim()}`,
        {
          headers: {
            'x-api-key': SOLANA_TRACKER_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: WalletResponse = await response.json();
      console.log('Wallet data:', data);

      // Find IKUN token in the wallet
      const ikunToken = data.tokens.find(token => token.token.mint === IKUN_TOKEN_MINT);
      
      if (ikunToken) {
        const ikunBalance = ikunToken.balance;
        const isEligible = ikunBalance >= MINIMUM_TOKENS;
        
        setResult({
          isEligible,
          ikunBalance,
          ikunValue: ikunToken.value,
        });
      } else {
        setResult({
          isEligible: false,
          ikunBalance: 0,
          ikunValue: 0,
          error: 'No IKUN tokens found in this wallet'
        });
      }

    } catch (err) {
      console.error('Error checking wallet eligibility:', err);
      setResult({
        isEligible: false,
        ikunBalance: 0,
        ikunValue: 0,
        error: err instanceof Error ? err.message : 'Failed to check wallet eligibility'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTokenAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toFixed(0);
  };

  const formatUsdValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="bg-gray-900 border border-gray-600 rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-orange-500 mb-2 font-tech">
          <DecryptedText 
            text="Check Airdrop Eligibility"
            speed={70}
            maxIterations={10}
            sequential={true}
            revealDirection="center"
            animateOn="view"
            className="text-orange-500"
            encryptedClassName="text-gray-500"
          />
        </h3>
        <p className="text-gray-300 font-tech">
          Enter your wallet address to check IKUN token holdings
        </p>
      </div>

      {/* Input Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter Solana wallet address (e.g., 2RH6rUTPBJ9r...)"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="flex-1 px-4 py-3 bg-black border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-sm"
            disabled={loading}
          />
          <button
            onClick={checkWalletEligibility}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-black font-bold py-3 px-6 rounded-lg font-tech uppercase tracking-wider transition-colors duration-200"
          >
            {loading ? 'Checking...' : 'Check Eligibility'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {result.error ? (
            <div className="bg-red-900 border border-red-600 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-300 font-tech">{result.error}</span>
              </div>
            </div>
          ) : (
            <div className={`border rounded-lg p-6 ${
              result.isEligible 
                ? 'bg-green-900 border-green-600' 
                : 'bg-red-900 border-red-600'
            }`}>
              <div className="text-center">
                <div className={`text-4xl font-black mb-2 ${
                  result.isEligible ? 'text-green-500' : 'text-red-500'
                }`}>
                  {result.isEligible ? '✓ ELIGIBLE' : '✗ NOT ELIGIBLE'}
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">
                      {formatTokenAmount(result.ikunBalance)}
                    </div>
                    <div className="text-sm text-gray-400">IKUN Tokens</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">
                      {formatUsdValue(result.ikunValue)}
                    </div>
                    <div className="text-sm text-gray-400">USD Value</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      result.isEligible ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatTokenAmount(MINIMUM_TOKENS)}
                    </div>
                    <div className="text-sm text-gray-400">Required</div>
                  </div>
                </div>

                {result.isEligible ? (
                  <div className="mt-6 p-4 bg-green-800 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-300 font-tech font-semibold">
                        🎉 Congratulations! You're eligible for BONKDROP airdrops!
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-red-800 rounded-lg">
                    <div className="text-red-300 font-tech">
                      You need {formatTokenAmount(MINIMUM_TOKENS - result.ikunBalance)} more IKUN tokens to be eligible for airdrops.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 text-center text-sm text-gray-400">
        <p>Enter any Solana wallet address to check IKUN token holdings and airdrop eligibility</p>
      </div>
    </div>
  );
};

export default WalletEligibilityChecker;
import React, { useEffect, useState } from 'react';
import DecryptedText from './DecryptedText';

interface TokenHolder {
  wallet: string;
  amount: number;
  value: {
    quote: number;
    usd: number;
  };
  percentage: number;
}

interface HoldersResponse {
  total: number;
  accounts: TokenHolder[];
}

const IkunHoldersBoard: React.FC = () => {
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalHolders, setTotalHolders] = useState<number>(0);

  const SOLANA_TRACKER_API_KEY = '4be0cb55-c2d4-4fdc-a15d-75a14e5c0029';
  const IKUN_TOKEN_ADDRESS = 'AtortPA9SVbkKmdzu5zg4jxgkR4howvPshorA9jYbonk'; // IKUN token address

  const fetchIkunHolders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching IKUN holders...');
      const response = await fetch(
        `https://data.solanatracker.io/tokens/${IKUN_TOKEN_ADDRESS}/holders`,
        {
          headers: {
            'x-api-key': SOLANA_TRACKER_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: HoldersResponse = await response.json();
      console.log('IKUN holders response:', data);
      
      // Filter holders with more than 100,000 tokens
      const eligibleHolders = data.accounts.filter(holder => holder.amount >= 100000);
      
      setHolders(eligibleHolders);
      setTotalHolders(data.total);
      
      console.log(`Found ${eligibleHolders.length} eligible holders with 100k+ IKUN tokens`);
      
    } catch (err) {
      console.error('Error fetching IKUN holders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch holders data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIkunHolders();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchIkunHolders, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-300">Loading IKUN holders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-4">
          <p className="text-red-300">Error: {error}</p>
        </div>
        <button
          onClick={fetchIkunHolders}
          className="bg-gray-800 text-orange-500 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{holders.length}</div>
          <div className="text-sm text-gray-400">Eligible Holders</div>
        </div>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{totalHolders.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Total Holders</div>
        </div>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">100K+</div>
          <div className="text-sm text-gray-400">Min Tokens Required</div>
        </div>
      </div>

      {/* Holders Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-3 px-4 text-orange-500 font-tech uppercase tracking-wider">
                <DecryptedText 
                  text="Rank"
                  speed={80}
                  maxIterations={8}
                  sequential={true}
                  revealDirection="start"
                  animateOn="view"
                  className="text-orange-500"
                  encryptedClassName="text-gray-500"
                />
              </th>
              <th className="text-left py-3 px-4 text-orange-500 font-tech uppercase tracking-wider">
                <DecryptedText 
                  text="Wallet"
                  speed={80}
                  maxIterations={8}
                  sequential={true}
                  revealDirection="start"
                  animateOn="view"
                  className="text-orange-500"
                  encryptedClassName="text-gray-500"
                />
              </th>
              <th className="text-right py-3 px-4 text-orange-500 font-tech uppercase tracking-wider">
                <DecryptedText 
                  text="IKUN Tokens"
                  speed={80}
                  maxIterations={8}
                  sequential={true}
                  revealDirection="start"
                  animateOn="view"
                  className="text-orange-500"
                  encryptedClassName="text-gray-500"
                />
              </th>
              <th className="text-right py-3 px-4 text-orange-500 font-tech uppercase tracking-wider">
                <DecryptedText 
                  text="USD Value"
                  speed={80}
                  maxIterations={8}
                  sequential={true}
                  revealDirection="start"
                  animateOn="view"
                  className="text-orange-500"
                  encryptedClassName="text-gray-500"
                />
              </th>
              <th className="text-right py-3 px-4 text-orange-500 font-tech uppercase tracking-wider">
                <DecryptedText 
                  text="% of Supply"
                  speed={80}
                  maxIterations={8}
                  sequential={true}
                  revealDirection="start"
                  animateOn="view"
                  className="text-orange-500"
                  encryptedClassName="text-gray-500"
                />
              </th>
            </tr>
          </thead>
        </table>
        <div className="max-h-[280px] overflow-y-auto">
          <table className="w-full">
            <tbody>
              {holders.length > 0 ? (
                holders.map((holder, index) => (
                <tr key={holder.wallet} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-orange-500 text-black' : 'bg-gray-700 text-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <a
                      href={`https://solscan.io/account/${holder.wallet}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-gray-300 hover:text-orange-400 transition-colors cursor-pointer"
                    >
                      {formatWalletAddress(holder.wallet)}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-orange-500">
                      {formatTokenAmount(holder.amount)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-gray-300">
                      {formatUsdValue(holder.value.usd)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-gray-400">
                      {holder.percentage.toFixed(3)}%
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No holders found with 100,000+ IKUN tokens
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-400 mt-4">
        Data updates every 30 seconds • Scroll to see more holders
      </div>
    </div>
  );
};

export default IkunHoldersBoard;
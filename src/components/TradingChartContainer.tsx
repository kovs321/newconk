import React, { useState } from 'react';
import RealTimeTradingChart from './RealTimeTradingChart';
import ChartControls from './ChartControls';
import { TimeInterval, COMMON_TOKENS } from '../services/SolanaTrackerService';

interface TokenPair {
  base: string;
  quote: string;
  baseSymbol: string;
  quoteSymbol: string;
}

interface TradingChartContainerProps {
  solanaTrackerApiKey: string;
  heliusApiKey: string;
  height?: number;
  showControls?: boolean;
}

const TradingChartContainer: React.FC<TradingChartContainerProps> = ({
  solanaTrackerApiKey,
  heliusApiKey,
  height = 500,
  showControls = true,
}) => {
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('1m');
  const [selectedTokenPair, setSelectedTokenPair] = useState<TokenPair>({
    base: COMMON_TOKENS.SOL,
    quote: COMMON_TOKENS.USDC,
    baseSymbol: 'SOL',
    quoteSymbol: 'USDC',
  });

  const handleIntervalChange = (interval: TimeInterval) => {
    setSelectedInterval(interval);
  };

  const handleTokenPairChange = (tokenPair: TokenPair) => {
    setSelectedTokenPair(tokenPair);
  };

  return (
    <div className="w-full space-y-4">
      {/* Chart Controls */}
      {showControls && (
        <ChartControls
          selectedInterval={selectedInterval}
          selectedTokenPair={selectedTokenPair}
          onIntervalChange={handleIntervalChange}
          onTokenPairChange={handleTokenPairChange}
        />
      )}

      {/* Trading Chart */}
      <div style={{ height: height + 'px' }}>
        <RealTimeTradingChart
          tokenPair={selectedTokenPair}
          interval={selectedInterval}
          height={height}
          solanaTrackerApiKey={solanaTrackerApiKey}
          heliusApiKey={heliusApiKey}
        />
      </div>

      {/* Chart Info */}
      <div className="text-xs text-gray-500 flex items-center justify-between">
        <div>
          Data provided by Solana Tracker & Helius • Real-time via WebSocket
        </div>
        <div className="flex items-center space-x-4">
          <span>Interval: {selectedInterval}</span>
          <span>Pair: {selectedTokenPair.baseSymbol}/{selectedTokenPair.quoteSymbol}</span>
        </div>
      </div>
    </div>
  );
};

export default TradingChartContainer;
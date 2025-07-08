import React from 'react';
import { TimeInterval, COMMON_TOKENS } from '../services/SolanaTrackerService';

interface TokenPair {
  base: string;
  quote: string;
  baseSymbol: string;
  quoteSymbol: string;
}

interface ChartControlsProps {
  selectedInterval: TimeInterval;
  selectedTokenPair: TokenPair;
  onIntervalChange: (interval: TimeInterval) => void;
  onTokenPairChange: (tokenPair: TokenPair) => void;
}

const INTERVALS: { value: TimeInterval; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' },
];

const TOKEN_PAIRS: TokenPair[] = [
  {
    base: COMMON_TOKENS.SOL,
    quote: COMMON_TOKENS.USDC,
    baseSymbol: 'SOL',
    quoteSymbol: 'USDC',
  },
  {
    base: COMMON_TOKENS.SOL,
    quote: COMMON_TOKENS.USDT,
    baseSymbol: 'SOL',
    quoteSymbol: 'USDT',
  },
  {
    base: COMMON_TOKENS.BONK,
    quote: COMMON_TOKENS.USDC,
    baseSymbol: 'BONK',
    quoteSymbol: 'USDC',
  },
  {
    base: COMMON_TOKENS.BONK,
    quote: COMMON_TOKENS.SOL,
    baseSymbol: 'BONK',
    quoteSymbol: 'SOL',
  },
  {
    base: COMMON_TOKENS.RAY,
    quote: COMMON_TOKENS.USDC,
    baseSymbol: 'RAY',
    quoteSymbol: 'USDC',
  },
  {
    base: COMMON_TOKENS.RAY,
    quote: COMMON_TOKENS.SOL,
    baseSymbol: 'RAY',
    quoteSymbol: 'SOL',
  },
  {
    base: COMMON_TOKENS.ORCA,
    quote: COMMON_TOKENS.USDC,
    baseSymbol: 'ORCA',
    quoteSymbol: 'USDC',
  },
  {
    base: COMMON_TOKENS.ORCA,
    quote: COMMON_TOKENS.SOL,
    baseSymbol: 'ORCA',
    quoteSymbol: 'SOL',
  },
];

const ChartControls: React.FC<ChartControlsProps> = ({
  selectedInterval,
  selectedTokenPair,
  onIntervalChange,
  onTokenPairChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
      {/* Token Pair Selection */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Pair:</label>
        <select
          value={`${selectedTokenPair.baseSymbol}/${selectedTokenPair.quoteSymbol}`}
          onChange={(e) => {
            const selected = TOKEN_PAIRS.find(
              pair => `${pair.baseSymbol}/${pair.quoteSymbol}` === e.target.value
            );
            if (selected) {
              onTokenPairChange(selected);
            }
          }}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          {TOKEN_PAIRS.map((pair) => (
            <option key={`${pair.baseSymbol}/${pair.quoteSymbol}`} value={`${pair.baseSymbol}/${pair.quoteSymbol}`}>
              {pair.baseSymbol}/{pair.quoteSymbol}
            </option>
          ))}
        </select>
      </div>

      {/* Interval Selection */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Timeframe:</label>
        <div className="flex bg-white rounded-md border border-gray-300 overflow-hidden">
          {INTERVALS.map((interval) => (
            <button
              key={interval.value}
              onClick={() => onIntervalChange(interval.value)}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                selectedInterval === interval.value
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Type (Future Enhancement) */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Type:</label>
        <select
          defaultValue="candlestick"
          disabled
          className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
        >
          <option value="candlestick">Candlestick</option>
          <option value="line">Line</option>
          <option value="area">Area</option>
        </select>
      </div>

      {/* Refresh Button */}
      <button
        onClick={() => window.location.reload()}
        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        title="Refresh Chart"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Fullscreen Button */}
      <button
        onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        }}
        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        title="Toggle Fullscreen"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  );
};

export default ChartControls;
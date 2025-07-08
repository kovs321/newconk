import React, { useEffect, useRef, useState, useCallback } from 'react';
import TradingChart, { OHLCVData } from './TradingChart';
import { SolanaTrackerService, TimeInterval, COMMON_TOKENS } from '../services/SolanaTrackerService';
import { HeliusWebSocketService, SwapEvent } from '../services/HeliusWebSocketService';
import { OHLCVAggregator, CandleUpdate } from '../services/OHLCVAggregator';

interface RealTimeTradingChartProps {
  tokenPair?: {
    base: string;
    quote: string;
    baseSymbol: string;
    quoteSymbol: string;
  };
  interval?: TimeInterval;
  height?: number;
  solanaTrackerApiKey: string;
  heliusApiKey: string;
}

const RealTimeTradingChart: React.FC<RealTimeTradingChartProps> = ({
  tokenPair = {
    base: COMMON_TOKENS.SOL,
    quote: COMMON_TOKENS.USDC,
    baseSymbol: 'SOL',
    quoteSymbol: 'USDC',
  },
  interval = '1m',
  height = 400,
  solanaTrackerApiKey,
  heliusApiKey,
}) => {
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [stats, setStats] = useState({
    volume24h: 0,
    priceChange: 0,
    priceChangePercent: 0,
    high24h: 0,
    low24h: 0,
  });

  const solanaTrackerRef = useRef<SolanaTrackerService | null>(null);
  const heliusWSRef = useRef<HeliusWebSocketService | null>(null);
  const aggregatorRef = useRef<OHLCVAggregator | null>(null);

  // Initialize services
  useEffect(() => {
    solanaTrackerRef.current = new SolanaTrackerService({
      apiKey: solanaTrackerApiKey,
    });

    heliusWSRef.current = new HeliusWebSocketService({
      apiKey: heliusApiKey,
    });

    aggregatorRef.current = new OHLCVAggregator(interval, {
      tokenIn: tokenPair.base,
      tokenOut: tokenPair.quote,
    });

    return () => {
      if (heliusWSRef.current) {
        heliusWSRef.current.disconnect();
      }
    };
  }, [solanaTrackerApiKey, heliusApiKey, interval, tokenPair]);

  // Handle candle updates from aggregator
  const handleCandleUpdate = useCallback((update: CandleUpdate) => {
    if (update.isNewCandle) {
      // Add new candle
      setChartData(prevData => [...prevData, update.candle]);
    } else {
      // Update existing candle
      setChartData(prevData => {
        const newData = [...prevData];
        const lastIndex = newData.length - 1;
        if (lastIndex >= 0) {
          newData[lastIndex] = update.candle;
        }
        return newData;
      });
    }

    // Update last price
    setLastPrice(update.candle.close);

    // Update stats
    if (aggregatorRef.current) {
      const sessionStats = aggregatorRef.current.getSessionStats();
      setStats({
        volume24h: sessionStats.totalVolume,
        priceChange: sessionStats.priceChange,
        priceChangePercent: sessionStats.priceChangePercent,
        high24h: sessionStats.high24h,
        low24h: sessionStats.low24h,
      });
    }
  }, []);

  // Handle swap events
  const handleSwapEvent = useCallback((swapEvent: SwapEvent) => {
    if (aggregatorRef.current) {
      aggregatorRef.current.processSwapEvent(swapEvent);
    }
  }, []);

  // Handle connection status changes
  const handleConnectionStatus = useCallback((connected: boolean) => {
    setConnectionStatus(connected);
  }, []);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    setError(error.message);
    console.error('Trading chart error:', error);
  }, []);

  // Load historical data and start real-time updates
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load historical data
        if (solanaTrackerRef.current) {
          const historicalData = await solanaTrackerRef.current.getRecentData(
            tokenPair.base,
            interval,
            100 // Get last 100 periods
          );

          if (isMounted) {
            setChartData(historicalData);
            setLastPrice(historicalData.length > 0 ? historicalData[historicalData.length - 1].close : null);

            // Initialize aggregator with historical data
            if (aggregatorRef.current) {
              aggregatorRef.current.setHistoricalData(historicalData);
              aggregatorRef.current.onCandleUpdate(handleCandleUpdate);
            }
          }
        }

        // Start WebSocket connection
        if (heliusWSRef.current && isMounted) {
          heliusWSRef.current.onSwapEvent(handleSwapEvent);
          heliusWSRef.current.onConnectionStatus(handleConnectionStatus);
          heliusWSRef.current.onError(handleError);

          await heliusWSRef.current.connect();
          
          // Subscribe to relevant DEX programs
          await heliusWSRef.current.subscribeToJupiterSwaps();
          await heliusWSRef.current.subscribeToRaydiumSwaps();
          await heliusWSRef.current.subscribeToOrcaSwaps();
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize trading chart:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load chart data');
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [tokenPair, interval, handleCandleUpdate, handleSwapEvent, handleConnectionStatus, handleError]);

  // Update aggregator when token pair or interval changes
  useEffect(() => {
    if (aggregatorRef.current) {
      aggregatorRef.current.setTokenPair({
        tokenIn: tokenPair.base,
        tokenOut: tokenPair.quote,
      });
      aggregatorRef.current.setInterval(interval);
    }
  }, [tokenPair, interval]);

  const formatPrice = (price: number | null) => {
    if (price === null) return '--';
    return price < 1 ? price.toFixed(6) : price.toFixed(2);
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Chart Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {tokenPair.baseSymbol}/{tokenPair.quoteSymbol}
            </h3>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">
                {connectionStatus ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Price Info */}
          <div className="flex items-center space-x-6">
            <div>
              <div className="text-xl font-bold text-gray-900">
                ${formatPrice(lastPrice)}
              </div>
              <div className={`text-sm ${getPriceChangeColor(stats.priceChange)}`}>
                {formatPercent(stats.priceChangePercent)}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <div>24h High: ${formatPrice(stats.high24h)}</div>
              <div>24h Low: ${formatPrice(stats.low24h)}</div>
            </div>
            
            <div className="text-sm text-gray-600">
              <div>24h Volume: {stats.volume24h.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-4">
        <TradingChart
          data={chartData}
          height={height}
          tokenSymbol={`${tokenPair.baseSymbol}/${tokenPair.quoteSymbol}`}
        />
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading chart data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeTradingChart;
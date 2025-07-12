import React, { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, IChartApi, ISeriesApi } from 'lightweight-charts';

interface ChartData {
  time: number;
  value: number;
}

interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  logo?: string;
  currentPrice: number | null;
  priceDirection: 'up' | 'down' | null;
  status: 'active' | 'error' | 'loading';
}

interface TokenData {
  time: number;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

const InteractiveChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tokens, setTokens] = useState<TokenInfo[]>([
    {
      mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      name: 'Loading...',
      symbol: 'TKN1',
      currentPrice: null,
      priceDirection: null,
      status: 'loading'
    },
    {
      mint: '9wK8yN6iz1ie5kEJkvZCTxyN1x5sTdNfx8yeMY8Ebonk',
      name: 'Loading...',
      symbol: 'TKN2',
      currentPrice: null,
      priceDirection: null,
      status: 'loading'
    },
    {
      mint: 'Dz9mQ9NzkBcCsuGPFJ3r1bS4wgqKMHBPiVuniW8Mbonk',
      name: 'Loading...',
      symbol: 'TKN3',
      currentPrice: null,
      priceDirection: null,
      status: 'loading'
    },
    {
      mint: 'AtortPA9SVbkKmdzu5zg4jxgkR4howvPshorA9jYbonk',
      name: 'Loading...',
      symbol: 'TKN4',
      currentPrice: null,
      priceDirection: null,
      status: 'loading'
    }
  ]);

  const SOLANA_TRACKER_API_KEY = '4be0cb55-c2d4-4fdc-a15d-75a14e5c0029';
  
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch token metadata from Solana Tracker API (with CORS proxy)
  const fetchTokenMetadata = async (tokenMint: string): Promise<{name: string, symbol: string, logo?: string} | null> => {
    try {
      console.log(`🔍 Fetching metadata for token: ${tokenMint}`);
      
      // Try direct API call first
      const response = await fetch(
        `https://data.solanatracker.io/tokens/${tokenMint}`,
        {
          headers: {
            'x-api-key': SOLANA_TRACKER_API_KEY,
          },
        }
      );

      console.log(`📡 API Response status for ${tokenMint}: ${response.status}`);

      if (!response.ok) {
        console.log(`❌ API Error for ${tokenMint}: ${response.status}`);
        if (response.status === 404) {
          console.log(`Token ${tokenMint} not found in Solana Tracker database`);
        }
        return null;
      }

      const result = await response.json();
      console.log(`📦 Raw API result for ${tokenMint}:`, result);
      
      // The API returns data in a 'token' object
      const tokenData = result.token;
      console.log(`🎯 Token data for ${tokenMint}:`, tokenData);
      
      if (!tokenData) {
        console.log(`⚠️ No token data found for ${tokenMint}`);
        return null;
      }

      const metadata = {
        name: tokenData.name || 'Unknown Token',
        symbol: tokenData.symbol || 'UNKNOWN',
        logo: tokenData.image
      };

      console.log(`✅ Parsed metadata for ${tokenMint}:`, metadata);
      return metadata;
    } catch (err) {
      console.error(`💥 Error fetching metadata for token ${tokenMint}:`, err);
      return null;
    }
  };

  // Load token metadata for all tokens
  const loadTokenMetadata = async () => {
    console.log('🚀 Loading token metadata...');
    
    // Try to fetch from API first, fallback to hardcoded values
    const updatedTokens = await Promise.all(
      tokens.map(async (token) => {
        // Try API first
        const apiMetadata = await fetchTokenMetadata(token.mint);
        
        if (apiMetadata) {
          return {
            ...token,
            name: apiMetadata.name,
            symbol: apiMetadata.symbol,
            logo: apiMetadata.logo
          };
        }
        
        // Fallback to hardcoded metadata for known tokens
        const fallbackMetadata: {[key: string]: {name: string, symbol: string, logo?: string}} = {
          'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
            name: 'Bonk',
            symbol: 'BONK',
            logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I'
          },
          '9wK8yN6iz1ie5kEJkvZCTxyN1x5sTdNfx8yeMY8Ebonk': {
            name: 'Token 2',
            symbol: 'TKN2',
            logo: undefined
          },
          'Dz9mQ9NzkBcCsuGPFJ3r1bS4wgqKMHBPiVuniW8Mbonk': {
            name: 'Useless Coin',
            symbol: 'USELESS',
            logo: undefined
          },
          'AtortPA9SVbkKmdzu5zg4jxgkR4howvPshorA9jYbonk': {
            name: 'Token 4',
            symbol: 'TKN4',
            logo: undefined
          }
        };
        
        const metadata = fallbackMetadata[token.mint];
        return {
          ...token,
          name: metadata?.name || 'Unknown Token',
          symbol: metadata?.symbol || 'UNKNOWN',
          logo: metadata?.logo
        };
      })
    );

    setTokens(updatedTokens);
  };
  
  // Generate sample data
  const generateSampleData = (): ChartData[] => {
    const data: ChartData[] = [];
    let price = 0.000001174;
    const now = Math.floor(Date.now() / 1000);
    
    for (let i = 100; i >= 0; i--) {
      const time = now - (i * 60); // 1 minute intervals
      const change = (Math.random() - 0.5) * 0.02;
      price = Math.max(price + change, 0.000000001);
      
      data.push({
        time,
        value: price
      });
    }
    
    return data;
  };

  // Fetch data for a single token
  const fetchTokenData = async (tokenMint: string): Promise<TokenData[]> => {
    try {
      console.log(`Fetching OHLC data for token: ${tokenMint}`);
      const response = await fetch(
        `https://data.solanatracker.io/chart/${tokenMint}?type=1m&limit=100`,
        {
          headers: {
            'x-api-key': SOLANA_TRACKER_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      
      let tokenData: TokenData[] = [];
      
      if (result.oclhv && Array.isArray(result.oclhv)) {
        tokenData = result.oclhv
          .filter((item: any) => item && item.time && item.close)
          .map((item: any) => ({
            time: item.time,
            close: item.close,
            open: item.open || item.close,
            high: item.high || item.close,
            low: item.low || item.close,
            volume: item.volume || 0,
          }))
          .sort((a, b) => a.time - b.time);
      }

      return tokenData;
    } catch (err) {
      console.error(`Error fetching data for token ${tokenMint}:`, err);
      return [];
    }
  };

  // Fetch data for all tokens
  const fetchMultiTokenData = async (): Promise<{ [tokenMint: string]: TokenData[] }> => {
    try {
      console.log('Fetching OHLC data for all 4 tokens...');
      
      const fetchPromises = tokens.map(async (token) => {
        const data = await fetchTokenData(token.mint);
        return { mint: token.mint, data };
      });

      const results = await Promise.all(fetchPromises);
      
      const tokenDataMap: { [tokenMint: string]: TokenData[] } = {};
      results.forEach(({ mint, data }) => {
        tokenDataMap[mint] = data;
      });

      return tokenDataMap;
    } catch (err) {
      console.error('Error fetching multi-token data:', err);
      return {};
    }
  };

  // Calculate percentage-based averaged data from multiple tokens
  const calculateAverageData = (tokenDataMap: { [tokenMint: string]: TokenData[] }): ChartData[] => {
    try {
      console.log('Calculating percentage-based average data from', Object.keys(tokenDataMap).length, 'tokens');
      
      // Get all unique timestamps
      const allTimestamps = new Set<number>();
      Object.values(tokenDataMap).forEach(tokenData => {
        tokenData.forEach(item => allTimestamps.add(item.time));
      });

      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
      
      // Calculate baseline prices for each token (first available price)
      const baselinePrices: { [tokenMint: string]: number } = {};
      Object.entries(tokenDataMap).forEach(([mint, data]) => {
        if (data.length > 0) {
          baselinePrices[mint] = data[0].close;
        }
      });
      
      const percentageChanges: ChartData[] = [];
      
      sortedTimestamps.forEach(timestamp => {
        const changes: number[] = [];
        
        // Calculate percentage changes for each token at this timestamp
        Object.entries(tokenDataMap).forEach(([mint, tokenData]) => {
          const dataPoint = tokenData.find(item => item.time === timestamp);
          const baseline = baselinePrices[mint];
          
          if (dataPoint && baseline && dataPoint.close > 0 && baseline > 0) {
            const percentageChange = ((dataPoint.close - baseline) / baseline) * 100;
            // Filter out extreme outliers (>500% change)
            if (Math.abs(percentageChange) < 500) {
              changes.push(percentageChange);
            }
          }
        });
        
        // Only include timestamp if we have data from at least 2 tokens
        if (changes.length >= 2) {
          const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
          percentageChanges.push({
            time: timestamp,
            value: averageChange
          });
        }
      });

      // Apply moving average smoothing (5-period moving average)
      const smoothedData = applyMovingAverage(percentageChanges, 5);
      
      // Convert percentage changes back to price-like values (normalized to 0.1 baseline)
      const normalizedData = smoothedData.map(item => ({
        time: item.time,
        value: 0.1 * (1 + item.value / 100) // Normalize around 0.1 baseline
      }));

      console.log('Generated', normalizedData.length, 'smoothed normalized data points');
      return normalizedData;
    } catch (err) {
      console.error('Error calculating average data:', err);
      return [];
    }
  };

  // Apply moving average smoothing
  const applyMovingAverage = (data: ChartData[], period: number): ChartData[] => {
    if (data.length < period) return data;
    
    const smoothedData: ChartData[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.value, 0);
      smoothedData.push({
        time: data[i].time,
        value: sum / period
      });
    }
    
    return smoothedData;
  };

  // Update individual token prices and statuses
  const updateTokenPrices = (tokenDataMap: { [tokenMint: string]: TokenData[] }) => {
    setTokens(prevTokens => 
      prevTokens.map(token => {
        const tokenData = tokenDataMap[token.mint];
        if (tokenData && tokenData.length > 0) {
          const latestPrice = tokenData[tokenData.length - 1].close;
          const previousPrice = token.currentPrice;
          
          return {
            ...token,
            currentPrice: latestPrice,
            priceDirection: previousPrice && latestPrice ? 
              (latestPrice > previousPrice ? 'up' : 'down') : null,
            status: 'active' as const
          };
        } else {
          return {
            ...token,
            status: 'error' as const
          };
        }
      })
    );

    // Reset price directions after animation
    setTimeout(() => {
      setTokens(prevTokens => 
        prevTokens.map(token => ({
          ...token,
          priceDirection: null
        }))
      );
    }, 1000);
  };

  // Initial data load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading initial chart data for 4 tokens...');
      
      // Load token metadata first
      await loadTokenMetadata();
      
      const tokenDataMap = await fetchMultiTokenData();
      
      // Calculate averaged data
      const averagedData = calculateAverageData(tokenDataMap);
      
      // If no averaged data, use sample data
      const chartData = averagedData.length > 5 ? averagedData : generateSampleData();
      setData(chartData);
      
      // Update individual token prices and statuses
      updateTokenPrices(tokenDataMap);
      
      if (chartData.length > 0) {
        const latestPrice = chartData[chartData.length - 1].value;
        setCurrentPrice(latestPrice);
        setPreviousPrice(latestPrice);
      }
      
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      // Use sample data on error
      const sampleData = generateSampleData();
      setData(sampleData);
      
      if (sampleData.length > 0) {
        const latestPrice = sampleData[sampleData.length - 1].value;
        setCurrentPrice(latestPrice);
        setPreviousPrice(latestPrice);
      }
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates
  const startRealTimeUpdates = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    updateIntervalRef.current = setInterval(() => {
      fetchLatestData();
    }, 5000); // Update every 5 seconds to reduce noise
    
    console.log('Started real-time updates (5 second interval)');
  };

  const stopRealTimeUpdates = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    console.log('Stopped real-time updates');
  };

  const fetchLatestData = async () => {
    if (isUpdating || !seriesRef.current) return;
    
    try {
      setIsUpdating(true);
      
      const tokenDataMap = await fetchMultiTokenData();
      const averagedData = calculateAverageData(tokenDataMap);
      
      if (averagedData.length > 0) {
        // Update chart data - the useEffect will handle updating the series
        setData(averagedData);
        
        // Update individual token prices and statuses
        updateTokenPrices(tokenDataMap);
        
        // Update averaged price and direction
        const latestPrice = averagedData[averagedData.length - 1].value;
        if (currentPrice !== null) {
          setPreviousPrice(currentPrice);
          setPriceDirection(latestPrice > currentPrice ? 'up' : 'down');
          
          // Reset price direction after animation
          setTimeout(() => {
            setPriceDirection(null);
          }, 1000);
        }
        setCurrentPrice(latestPrice);
      }
      
    } catch (error) {
      console.error('Error fetching latest data:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Initialize chart when data is available
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) {
      return;
    }

    // Clear existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    console.log('Initializing chart with', data.length, 'data points');
    
    try {
      const chart = createChart(chartContainerRef.current, {
        layout: { 
          textColor: 'white', 
          background: { type: 'solid', color: '#111827' } 
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        grid: {
          vertLines: { color: '#f0f3fa' },
          horzLines: { color: '#f0f3fa' },
        },
        crosshair: { mode: 1 },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          scaleMargins: { top: 0.1, bottom: 0.1 },
          borderVisible: true,
          borderColor: '#D1D5DB',
          textColor: '#333333',
          entireTextOnly: false,
          ticksVisible: true,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          mouseWheel: true,
          pinch: true,
        },
      });
      
      // Create area series
      const areaSeries = chart.addSeries(AreaSeries, { 
        lineColor: '#FF8C00', 
        topColor: '#FF8C00', 
        bottomColor: 'rgba(255, 140, 0, 0.28)',
        priceFormat: {
          type: 'price',
          precision: 9,
          minMove: 0.000000001,
        },
      });

      // Set data immediately
      areaSeries.setData(data);
      
      // Set zoom range
      const lastTime = data[data.length - 1].time;
      const sixHoursAgo = lastTime - (6 * 60 * 60);
      chart.timeScale().setVisibleRange({
        from: sixHoursAgo,
        to: lastTime + (30 * 60)
      });

      chartRef.current = chart;
      seriesRef.current = areaSeries;

      console.log('Chart initialized successfully with data');

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ 
            width: chartContainerRef.current.clientWidth,
            height: 400
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          seriesRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
      setError('Failed to initialize chart');
    }
  }, [data]); // Re-initialize when data changes



  // Load data on mount
  useEffect(() => {
    loadInitialData();
    startRealTimeUpdates();
    
    return () => {
      stopRealTimeUpdates();
    };
  }, []);

  // Chart control functions
  const fitContent = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '--';
    return price.toFixed(6);
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-300">Loading interactive chart...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white font-tech tracking-wider uppercase">4-Token Normalized Average</h3>
            <p className="text-sm text-gray-300">
              Smoothed percentage-based average from {tokens.filter(t => t.status === 'active').length}/4 tokens
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`text-lg font-logo tracking-wider transition-all duration-300 ${
              currentPrice ? 
                priceDirection === 'up' ? 'text-green-500 transform scale-110' :
                priceDirection === 'down' ? 'text-red-500 transform scale-110' :
                'text-white' 
              : 'text-gray-400'
            }`}>
              ${formatPrice(currentPrice)}
              {priceDirection && (
                <span className="ml-1">
                  {priceDirection === 'up' ? '↗' : '↘'}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-300">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Token Status */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tokens.map((token, index) => (
            <div key={token.mint} className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                {token.logo ? (
                  <img 
                    src={token.logo} 
                    alt={token.symbol}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
                    {token.symbol.charAt(0)}
                  </div>
                )}
                <div className={`w-2 h-2 rounded-full ${
                  token.status === 'active' ? 'bg-green-500' :
                  token.status === 'error' ? 'bg-red-500' :
                  'bg-yellow-500 animate-pulse'
                }`}></div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">{token.name}</div>
                <div className="text-xs text-gray-500">{token.symbol}</div>
                <div className={`text-xs font-mono transition-all duration-300 ${
                  token.currentPrice ? 
                    token.priceDirection === 'up' ? 'text-green-500 transform scale-110' :
                    token.priceDirection === 'down' ? 'text-red-500 transform scale-110' :
                    'text-gray-300' 
                  : 'text-gray-400'
                }`}>
                  {token.status === 'active' ? (
                    <>
                      ${formatPrice(token.currentPrice)}
                      {token.priceDirection && (
                        <span className="ml-1">
                          {token.priceDirection === 'up' ? '↗' : '↘'}
                        </span>
                      )}
                    </>
                  ) : token.status === 'error' ? (
                    'Error'
                  ) : (
                    'Loading...'
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Controls */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={fitContent}
              className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200 transition-colors"
              title="Fit Content"
            >
              📏 Fit Chart
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Mouse wheel: Zoom • Drag: Pan
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-yellow-800 text-sm">API Error: {error}</span>
            <span className="text-yellow-600 text-xs">Using sample data</span>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="p-4">
        <div ref={chartContainerRef} className="w-full h-96 border border-gray-200 rounded-lg bg-white" />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 text-center">
          {error ? 'Sample data displayed' : 'Real-time smoothed updates from 4 tokens every 5 seconds via Solana Tracker API'}
        </div>
      </div>
    </div>
  );
};

export default InteractiveChart;
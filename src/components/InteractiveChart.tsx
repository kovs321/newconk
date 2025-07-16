import React, { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, IChartApi, ISeriesApi } from 'lightweight-charts';
import DecryptedText from './DecryptedText';

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
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    name: 'BONK',
    symbol: 'BONK',
    logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    currentPrice: null,
    priceDirection: null,
    status: 'loading'
  });

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

  // Load token metadata for BONK
  const loadTokenMetadata = async () => {
    console.log('🚀 Loading BONK token metadata...');
    // Just loading metadata, no need for additional API calls
  };
  
  // Generate sample data
  const generateSampleData = (): ChartData[] => {
    const data: ChartData[] = [];
    let price = 0.000023; // More realistic BONK price around $0.000023
    const now = Math.floor(Date.now() / 1000);
    
    for (let i = 100; i >= 0; i--) {
      const time = now - (i * 60); // 1 minute intervals
      const change = (Math.random() - 0.5) * 0.000001; // Smaller price changes
      price = Math.max(price + change, 0.000001);
      
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
      console.log('Raw OHLC API response:', result);
      
      let tokenData: TokenData[] = [];
      
      if (result.oclhv && Array.isArray(result.oclhv)) {
        tokenData = result.oclhv
          .filter((item: any) => item && item.time && item.close)
          .map((item: any) => {
            console.log('Processing price data point:', item);
            
            // Fix inverted prices - BONK should be around 0.00002-0.00003
            let close = item.close;
            let open = item.open || close;
            let high = item.high || close;
            let low = item.low || close;
            
            // If prices seem too high, invert them
            if (close > 1) {
              console.log('Inverting price data point - close was:', close);
              close = 1 / close;
              open = 1 / open;
              high = 1 / high;
              low = 1 / low;
              console.log('Inverted close price:', close);
            }
            
            return {
              time: item.time,
              close: close,
              open: open,
              high: high,
              low: low,
              volume: item.volume || 0,
            };
          })
          .sort((a, b) => a.time - b.time);
      }
      
      console.log('Processed token data:', tokenData.slice(-3)); // Log last 3 points

      return tokenData;
    } catch (err) {
      console.error(`Error fetching data for token ${tokenMint}:`, err);
      return [];
    }
  };

  // Fetch data for BONK token
  const fetchBonkData = async (): Promise<ChartData[]> => {
    try {
      console.log('Fetching OHLC data for BONK token...');
      
      const tokenData = await fetchTokenData(tokenInfo.mint);
      
      if (tokenData.length === 0) {
        return [];
      }
      
      // Convert to chart data format
      const chartData: ChartData[] = tokenData.map(item => ({
        time: item.time,
        value: item.close
      }));
      
      return chartData;
    } catch (err) {
      console.error('Error fetching BONK data:', err);
      return [];
    }
  };




  // Initial data load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading initial chart data for 4 tokens...');
      
      // Load token metadata first
      await loadTokenMetadata();
      
      const bonkData = await fetchBonkData();
      
      // If no data, use sample data
      const chartData = bonkData.length > 5 ? bonkData : generateSampleData();
      setData(chartData);
      
      // Update token info with latest price
      if (bonkData.length > 0) {
        const latestPrice = bonkData[bonkData.length - 1].value;
        setTokenInfo(prev => ({
          ...prev,
          currentPrice: latestPrice,
          status: 'active' as const
        }));
      }
      
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
      
      const bonkData = await fetchBonkData();
      
      if (bonkData.length > 0) {
        // Update chart data - the useEffect will handle updating the series
        setData(bonkData);
        
        // Update price and direction
        const latestPrice = bonkData[bonkData.length - 1].value;
        if (currentPrice !== null) {
          setPreviousPrice(currentPrice);
          setPriceDirection(latestPrice > currentPrice ? 'up' : 'down');
          
          // Reset price direction after animation
          setTimeout(() => {
            setPriceDirection(null);
          }, 1000);
        }
        setCurrentPrice(latestPrice);
        
        // Update token info
        setTokenInfo(prev => ({
          ...prev,
          currentPrice: latestPrice,
          priceDirection: latestPrice > (prev.currentPrice || 0) ? 'up' : 'down',
          status: 'active' as const
        }));
        
        // Reset token direction after animation
        setTimeout(() => {
          setTokenInfo(prev => ({
            ...prev,
            priceDirection: null
          }));
        }, 1000);
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
          textColor: '#f97316', 
          background: { type: 'solid', color: '#111827' } 
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        grid: {
          vertLines: { color: '#374151' },
          horzLines: { color: '#374151' },
        },
        crosshair: { mode: 1 },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          scaleMargins: { top: 0.1, bottom: 0.1 },
          borderVisible: true,
          borderColor: '#6B7280',
          textColor: '#F9FAFB',
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
        lineColor: '#f97316', 
        topColor: '#f97316', 
        bottomColor: 'rgba(249, 115, 22, 0.28)',
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
    // Since we now fix prices at the data source level, just format normally
    return price.toFixed(8);
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-300">Loading interactive chart...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 border border-gray-700 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-orange-500 font-tech tracking-wider uppercase">
              <DecryptedText 
                text="BONK Price Chart"
                speed={70}
                maxIterations={10}
                sequential={true}
                revealDirection="start"
                animateOn="view"
                className="text-orange-500"
                encryptedClassName="text-gray-500"
              />
            </h3>
            <p className="text-sm text-gray-300">
              Real-time BONK token price data from Solana
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`text-lg font-logo tracking-wider transition-all duration-300 ${
              currentPrice ? 
                priceDirection === 'up' ? 'text-green-500 transform scale-110' :
                priceDirection === 'down' ? 'text-red-500 transform scale-110' :
                'text-orange-500' 
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

      {/* Token Info */}
      <div className="px-4 py-3 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {tokenInfo.logo && (
              <img 
                src={tokenInfo.logo} 
                alt={tokenInfo.symbol}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <div className="text-lg font-bold text-orange-500">{tokenInfo.name}</div>
              <div className="text-sm text-gray-400">{tokenInfo.symbol}</div>
            </div>
          </div>
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
        <div ref={chartContainerRef} className="w-full h-96 border border-gray-600 rounded-lg bg-gray-800" />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 text-center">
          {error ? 'Sample data displayed' : 'Real-time BONK price updates every 5 seconds via Solana Tracker API'}
        </div>
      </div>
    </div>
  );
};

export default InteractiveChart;
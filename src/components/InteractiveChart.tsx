import React, { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, IChartApi, ISeriesApi } from 'lightweight-charts';

interface ChartData {
  time: number;
  value: number;
}

interface TokenData {
  mint: string;
  name: string;
  symbol: string;
  color: string;
  topColor: string;
  bottomColor: string;
  currentPrice: number | null;
  priceDirection: 'up' | 'down' | null;
  data: ChartData[];
}

const InteractiveChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<{ [key: string]: ISeriesApi<'Area'> }>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Single token with blue color
  const [tokens, setTokens] = useState<TokenData[]>([
    {
      mint: 'Dz9mQ9NzkBcCsuGPFJ3r1bS4wgqKMHBPiVuniW8Mbonk',
      name: 'BONK Token',
      symbol: 'BONK',
      color: '#2962FF',
      topColor: '#2962FF',
      bottomColor: 'rgba(41, 98, 255, 0.28)',
      currentPrice: null,
      priceDirection: null,
      data: []
    }
  ]);

  const SOLANA_TRACKER_API_KEY = 'ab5915df-4f94-449a-96c5-c37cbc92ef47';
  
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate sample data for each token with different price ranges
  const generateSampleDataForToken = (tokenIndex: number): ChartData[] => {
    const data: ChartData[] = [];
    const basePrices = [0.000001174, 0.000002385, 0.000000956, 0.000001847];
    let price = basePrices[tokenIndex] || 0.000001174;
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

  // Fetch data for a specific token
  const fetchTokenData = async (tokenMint: string): Promise<ChartData[]> => {
    try {
      console.log(`Fetching data for token: ${tokenMint}`);
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
      
      let chartData: ChartData[] = [];
      
      if (result.oclhv && Array.isArray(result.oclhv)) {
        chartData = result.oclhv
          .filter((item: any) => item && item.time && item.close)
          .map((item: any) => ({
            time: item.time,
            value: item.close,
          }))
          .sort((a, b) => a.time - b.time);
      }

      return chartData;
    } catch (err) {
      console.error(`Error fetching data for token ${tokenMint}:`, err);
      return [];
    }
  };

  // Fetch data for all tokens
  const fetchAllTokensData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching data for all tokens...');
      
      const tokenDataPromises = tokens.map(async (token, index) => {
        const apiData = await fetchTokenData(token.mint);
        
        // If no API data, use sample data
        const finalData = apiData.length > 5 ? apiData : generateSampleDataForToken(index);
        
        return {
          ...token,
          data: finalData,
          currentPrice: finalData.length > 0 ? finalData[finalData.length - 1].value : null
        };
      });

      const updatedTokens = await Promise.all(tokenDataPromises);
      setTokens(updatedTokens);
      
    } catch (err) {
      console.error('Error fetching all tokens data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      // Use sample data for all tokens on error
      const updatedTokens = tokens.map((token, index) => ({
        ...token,
        data: generateSampleDataForToken(index),
        currentPrice: generateSampleDataForToken(index).slice(-1)[0]?.value || null
      }));
      
      setTokens(updatedTokens);
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates for all tokens
  const startRealTimeUpdates = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    updateIntervalRef.current = setInterval(() => {
      fetchLatestDataForAllTokens();
    }, 5000); // Update every 5 seconds for multiple tokens
    
    console.log('Started real-time updates for all tokens (5 second interval)');
  };

  const stopRealTimeUpdates = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    console.log('Stopped real-time updates');
  };

  const fetchLatestDataForAllTokens = async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      const updatedTokens = await Promise.all(
        tokens.map(async (token) => {
          const latestData = await fetchTokenData(token.mint);
          
          if (latestData.length > 0) {
            const latestPoint = latestData[latestData.length - 1];
            const previousPrice = token.currentPrice;
            
            // Update chart series
            const series = seriesRefs.current[token.mint];
            if (series) {
              series.update(latestPoint);
            }
            
            return {
              ...token,
              currentPrice: latestPoint.value,
              priceDirection: previousPrice ? 
                (latestPoint.value > previousPrice ? 'up' : 'down') : null
            };
          }
          
          return token;
        })
      );
      
      setTokens(updatedTokens);
      
      // Reset price direction after animation
      setTimeout(() => {
        setTokens(prev => prev.map(token => ({
          ...token,
          priceDirection: null
        })));
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching latest data for all tokens:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Initialize chart when tokens data is ready
  useEffect(() => {
    if (!chartContainerRef.current || tokens.length === 0 || tokens.every(token => token.data.length === 0)) {
      return;
    }

    console.log('Initializing multi-token chart...');
    
    try {
      const chart = createChart(chartContainerRef.current, {
        layout: { 
          textColor: 'black', 
          background: { type: 'solid', color: 'white' } 
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
      
      // Create series for each token
      const newSeriesRefs: { [key: string]: ISeriesApi<'Area'> } = {};
      
      tokens.forEach((token) => {
        if (token.data.length > 0) {
          const areaSeries = chart.addSeries(AreaSeries, { 
            lineColor: token.color, 
            topColor: token.topColor, 
            bottomColor: token.bottomColor,
            priceFormat: {
              type: 'price',
              precision: 9,
              minMove: 0.000000001,
            },
            priceLineVisible: false, // Hide individual price lines to avoid clutter
            lastValueVisible: true,
          });

          // Set data for this token
          const formattedData = token.data.map(item => ({
            time: item.time,
            value: Number(item.value)
          }));
          
          areaSeries.setData(formattedData);
          newSeriesRefs[token.mint] = areaSeries;
        }
      });
      
      // Set initial zoom to show last 6 hours
      const allData = tokens.flatMap(token => token.data);
      if (allData.length > 0) {
        const lastTime = Math.max(...allData.map(item => item.time));
        const sixHoursAgo = lastTime - (6 * 60 * 60);
        
        chart.timeScale().setVisibleRange({
          from: sixHoursAgo,
          to: lastTime + (30 * 60)
        });
      }

      chartRef.current = chart;
      seriesRefs.current = newSeriesRefs;

      console.log('Multi-token chart initialized successfully');

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
          seriesRefs.current = {};
        }
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
      setError('Failed to initialize chart');
    }
  }, [tokens]);

  // Load data on mount
  useEffect(() => {
    fetchAllTokensData();
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
    return price.toFixed(9);
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading interactive chart...</span>
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
            <h3 className="text-lg font-black text-gray-900">BONK Token Chart</h3>
            <p className="text-sm text-gray-600">Real-time price updates</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-600">Live</span>
          </div>
        </div>
      </div>

      {/* Token Legend */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex justify-center">
          {tokens.map((token) => (
            <div key={token.mint} className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: token.color }}
              ></div>
              <div className="min-w-0">
                <div className="text-lg font-medium text-gray-900">{token.symbol}</div>
                <div className={`text-base font-mono transition-all duration-300 ${
                  token.currentPrice ? 
                    token.priceDirection === 'up' ? 'text-green-500 transform scale-110' :
                    token.priceDirection === 'down' ? 'text-red-500 transform scale-110' :
                    'text-gray-600' 
                  : 'text-gray-400'
                }`}>
                  ${formatPrice(token.currentPrice)}
                  {token.priceDirection && (
                    <span className="ml-1">
                      {token.priceDirection === 'up' ? '↗' : '↘'}
                    </span>
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
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
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
        <div ref={chartContainerRef} className="w-full h-96 border border-gray-200 rounded-lg" />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 text-center">
          {error ? 'Sample data displayed' : 'Real-time updates via Solana Tracker API'}
        </div>
      </div>
    </div>
  );
};

export default InteractiveChart;
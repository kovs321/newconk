import React, { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, IChartApi, ISeriesApi } from 'lightweight-charts';

interface ChartData {
  time: number;
  value: number;
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
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const TOKEN_MINT = '34VWJ7PPwcPpYEqTGJQXo8qaMJYoP8VKuBGHPG3ypump';
  const SOLANA_TRACKER_API_KEY = 'ab5915df-4f94-449a-96c5-c37cbc92ef47';
  const SOLANA_TRACKER_WS_URL = 'wss://datastream.solanatracker.io/d4fc0684-2e18-4de4-abab-cbe984738ea7';
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const reconnectDelay = 2500;
  const reconnectDelayMax = 4500;
  const randomizationFactor = 0.5;

  // WebSocket connection management
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('Connecting to Solana Tracker WebSocket...');
    setWsStatus('connecting');

    const ws = new WebSocket(SOLANA_TRACKER_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to Solana Tracker');
      setWsStatus('connected');
      reconnectAttempts.current = 0;
      subscribeToPriceUpdates();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected from Solana Tracker');
      setWsStatus('disconnected');
      wsRef.current = null;
      reconnectWebSocket();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsStatus('disconnected');
    };
  };

  const reconnectWebSocket = () => {
    console.log('Reconnecting to WebSocket server');
    const delay = Math.min(
      reconnectDelay * Math.pow(2, reconnectAttempts.current),
      reconnectDelayMax
    );
    const jitter = delay * randomizationFactor;
    const reconnectDelayCalculated = delay + Math.random() * jitter;

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current++;
      connectWebSocket();
    }, reconnectDelayCalculated);
  };

  const subscribeToPriceUpdates = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Subscribe to price updates for the token
    const priceSubscription = {
      type: 'join',
      room: `price-by-token:${TOKEN_MINT}`
    };

    wsRef.current.send(JSON.stringify(priceSubscription));
    console.log(`Subscribed to price updates for token: ${TOKEN_MINT}`);
  };

  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'message') {
      if (message.room === `price-by-token:${TOKEN_MINT}`) {
        const priceData = message.data;
        console.log('Price update received:', priceData);
        
        // Update current price immediately with direction
        setCurrentPrice(prevPrice => {
          if (prevPrice !== null) {
            setPreviousPrice(prevPrice);
            setPriceDirection(priceData.price > prevPrice ? 'up' : 'down');
            // Reset direction after animation
            setTimeout(() => setPriceDirection(null), 1000);
          }
          return priceData.price;
        });
        
        // Update the chart with new price data
        updateChartWithPrice(priceData);
      }
    }
  };

  const updateChartWithPrice = (priceData: any) => {
    const chartPoint: ChartData = {
      time: Math.floor(priceData.time / 1000), // Convert to seconds
      value: priceData.price
    };

    // Add to existing data
    setData(prevData => {
      const newData = [...prevData, chartPoint].sort((a, b) => a.time - b.time);
      return newData;
    });

    // Update current price is already handled above

    // Update chart if series is ready
    if (seriesRef.current) {
      seriesRef.current.update(chartPoint);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      // Leave the room before closing
      const leaveSubscription = {
        type: 'leave',
        room: `price-by-token:${TOKEN_MINT}`
      };
      wsRef.current.send(JSON.stringify(leaveSubscription));
      
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };


  // Generate simple sample data for area chart
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
    
    console.log('Generated sample data:', data.slice(0, 5));
    return data;
  };

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching data from Solana Tracker API...');
      const response = await fetch(
        `https://data.solanatracker.io/chart/${TOKEN_MINT}?type=1m&limit=100`,
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
      console.log('API Response:', result);
      
      let chartData: ChartData[] = [];
      
      if (result.oclhv && Array.isArray(result.oclhv)) {
        chartData = result.oclhv
          .filter((item: any) => item && item.time && item.close) // Filter out invalid data
          .map((item: any) => ({
            time: item.time,
            value: item.close,
          }))
          .sort((a, b) => a.time - b.time); // Sort by time
        console.log('Processed chart data:', chartData);
        console.log('Sample data points:', chartData.slice(0, 5));
      }

      // If no data or very little data, use sample data
      if (chartData.length < 5) {
        console.log('Using sample data due to insufficient API data');
        chartData = generateSampleData();
      }

      setData(chartData);
      if (chartData.length > 0) {
        setCurrentPrice(chartData[chartData.length - 1].value);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      // Use sample data on error
      const sampleData = generateSampleData();
      setData(sampleData);
      setCurrentPrice(sampleData[sampleData.length - 1].value);
    } finally {
      setLoading(false);
    }
  };

  // Initialize chart with area series
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chartOptions = { 
        layout: { 
          textColor: 'black', 
          background: { type: 'solid', color: 'white' } 
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        grid: {
          vertLines: { 
            color: '#f0f3fa',
            style: 1,
            visible: true,
          },
          horzLines: { 
            color: '#f0f3fa',
            style: 1,
            visible: true,
          },
        },
        crosshair: {
          mode: 1,
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        // Enable interactions
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          mouseWheel: true,
          pinch: true,
        },
      };

      const chart = createChart(chartContainerRef.current, chartOptions);
      
      const areaSeries = chart.addSeries(AreaSeries, { 
        lineColor: '#2962FF', 
        topColor: '#2962FF', 
        bottomColor: 'rgba(41, 98, 255, 0.28)' 
      });

      chartRef.current = chart;
      seriesRef.current = areaSeries;

      console.log('Chart initialized, series ready:', !!seriesRef.current);

      // If we already have data, set it immediately
      if (data.length > 0) {
        console.log('Setting existing data to newly initialized chart');
        const formattedData = data.map(item => ({
          time: item.time,
          value: Number(item.value)
        }));
        areaSeries.setData(formattedData);
        chart.timeScale().fitContent();
      }

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          const container = chartContainerRef.current;
          chartRef.current.applyOptions({ 
            width: container.clientWidth,
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
  }, [data]);

  // Update chart data
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      try {
        console.log('Setting data to chart:', data.length, 'points');
        console.log('First 3 data points:', data.slice(0, 3));
        
        // Ensure data is properly formatted
        const formattedData = data.map(item => ({
          time: item.time,
          value: Number(item.value)
        }));
        
        seriesRef.current.setData(formattedData);
        
        // Fit content to show all data initially
        if (chartRef.current) {
          setTimeout(() => {
            chartRef.current?.timeScale().fitContent();
          }, 100);
        }
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    } else {
      console.log('Chart not ready or no data:', {
        seriesReady: !!seriesRef.current,
        dataLength: data.length
      });
    }
  }, [data]);

  // Load data on mount
  useEffect(() => {
    // Temporary: Force sample data for testing
    console.log('Loading sample data for testing...');
    const sampleData = generateSampleData();
    setData(sampleData);
    setCurrentPrice(sampleData[sampleData.length - 1].value);
    setLoading(false);
    
    // Also fetch real data
    fetchData();
    
    // Connect to WebSocket for live updates
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
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
            <h3 className="text-lg font-semibold text-gray-900">Live Token Chart</h3>
            <p className="text-sm text-gray-600">Real-time price updates via WebSocket</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Current Price</div>
              <div className={`text-2xl font-bold transition-all duration-300 ${
                currentPrice ? 
                  priceDirection === 'up' ? 'text-green-500 transform scale-110' :
                  priceDirection === 'down' ? 'text-red-500 transform scale-110' :
                  'text-blue-600' 
                : 'text-gray-400'
              }`}>
                ${formatPrice(currentPrice)}
                {priceDirection && (
                  <span className="ml-1 text-sm">
                    {priceDirection === 'up' ? '↗' : '↘'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                wsStatus === 'connected' ? 'bg-green-500' : 
                wsStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-600">
                {wsStatus === 'connected' ? 'Live' : 
                 wsStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
              </span>
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
      <div className="px-4 pb-4 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {error ? 'Sample data displayed' : 'Historical: Solana Tracker API | Live: Solana Tracker WebSocket'}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={connectWebSocket}
            disabled={wsStatus === 'connecting'}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {wsStatus === 'connecting' ? 'Connecting...' : 'Reconnect WS'}
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveChart;
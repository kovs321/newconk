import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Datastream } from '@solana-tracker/data-api';

interface PriceData {
  time: number;
  value: number;
}

const LiveWebSocketChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const datastreamRef = useRef<Datastream | null>(null);
  const subscriptionRef = useRef<any>(null);
  
  const [data, setData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const TOKEN_MINT = '71B6bJU6nAFrEJfRyvhToR4r9qA3H7tY2whvup4ibonk'; // Custom token
  const DATASTREAM_URL = 'wss://datastream.solanatracker.io/d4fc0684-2e18-4de4-abab-cbe984738ea7';

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('Initializing live WebSocket chart with LineSeries...');
    
    try {
      const chart = createChart(chartContainerRef.current, {
        layout: { 
          textColor: 'black', 
          background: { type: 'solid', color: 'white' } 
        },
        width: chartContainerRef.current.clientWidth,
        height: 300,
        grid: {
          vertLines: { color: '#f0f3fa' },
          horzLines: { color: '#f0f3fa' },
        },
        crosshair: { mode: 1 },
        timeScale: {
          timeVisible: true,
          secondsVisible: true,
          borderVisible: true,
          rightOffset: 12,
          barSpacing: 24,
        },
        rightPriceScale: {
          scaleMargins: { top: 0.1, bottom: 0.1 },
          borderVisible: true,
          borderColor: '#D1D5DB',
          textColor: '#333333',
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
      
      const lineSeries = chart.addSeries(LineSeries, { 
        color: '#2962FF',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 6,
          minMove: 0.000001,
        },
        priceLineVisible: true,
        lastValueVisible: true,
        title: 'Token Live Price',
      });

      chartRef.current = chart;
      seriesRef.current = lineSeries;

      // Initialize with existing data if any
      if (data.length > 0) {
        lineSeries.setData(data);
      }

      console.log('Live line chart initialized successfully');

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ 
            width: chartContainerRef.current.clientWidth,
            height: 300
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
      console.error('Error initializing live chart:', error);
      setError('Failed to initialize live chart');
    }
  }, []);

  // Handle price updates
  const handlePriceUpdate = (priceData: any) => {
    const newPoint: PriceData = {
      time: Math.floor(priceData.time / 1000), // Convert to seconds
      value: priceData.price
    };

    // Update current price with direction
    setCurrentPrice(prevPrice => {
      if (prevPrice !== null) {
        setPriceDirection(priceData.price > prevPrice ? 'up' : 'down');
        setTimeout(() => setPriceDirection(null), 1000);
      }
      return priceData.price;
    });

    // Add to chart data
    setData(prevData => {
      const newData = [...prevData, newPoint];
      
      // Keep only last 1000 points for performance
      if (newData.length > 1000) {
        newData.splice(0, newData.length - 1000);
      }
      
      return newData;
    });

    // Update chart
    if (seriesRef.current) {
      seriesRef.current.update(newPoint);
      
      // Auto-scroll to keep latest data visible
      if (chartRef.current) {
        const timeScale = chartRef.current.timeScale();
        const logicalRange = timeScale.getVisibleLogicalRange();
        
        // If we're close to the right edge, scroll to show new data
        if (logicalRange && logicalRange.to > data.length - 10) {
          timeScale.scrollToRealTime();
        }
      }
    }
  };

  // Initialize Datastream and connect
  useEffect(() => {
    const initializeDatastream = async () => {
      try {
        console.log('Initializing Datastream connection...');
        setWsStatus('connecting');

        // Initialize Datastream
        const datastream = new Datastream({
          wsUrl: DATASTREAM_URL
        });

        datastreamRef.current = datastream;

        // Setup connection event listeners
        datastream.on('connected', () => {
          console.log('Datastream connected successfully');
          setWsStatus('connected');
          setError(null);
        });

        datastream.on('disconnected', (socketType) => {
          console.log(`Datastream disconnected: ${socketType}`);
          setWsStatus('disconnected');
        });

        datastream.on('reconnecting', (attempt) => {
          console.log(`Datastream reconnecting: attempt ${attempt}`);
          setWsStatus('connecting');
        });

        datastream.on('error', (error) => {
          console.error('Datastream error:', error);
          setError('WebSocket connection failed');
          setWsStatus('disconnected');
        });

        // Connect to the WebSocket server
        await datastream.connect();

        // Subscribe to price updates for token - try both methods
        console.log(`Subscribing to price updates for token: ${TOKEN_MINT}`);
        
        // First try the main pool subscription
        const priceSubscription = datastream.subscribe.price.token(TOKEN_MINT).on((priceData) => {
          console.log('Live price update received (main pool):', priceData);
          handlePriceUpdate(priceData);
        });

        // Also try all pools subscription as fallback
        const allPoolsSubscription = datastream.subscribe.price.allPoolsForToken(TOKEN_MINT).on((priceData) => {
          console.log('Live price update received (all pools):', priceData);
          handlePriceUpdate(priceData);
        });

        // Test with SOL to verify connection works
        const solSubscription = datastream.subscribe.price.token('So11111111111111111111111111111111111111111').on((priceData) => {
          console.log('SOL price update received (connection test):', priceData);
        });

        subscriptionRef.current = { priceSubscription, allPoolsSubscription, solSubscription };

      } catch (error) {
        console.error('Error initializing Datastream:', error);
        setError('Failed to initialize WebSocket connection');
        setWsStatus('disconnected');
      }
    };

    initializeDatastream();

    return () => {
      // Cleanup on unmount
      if (subscriptionRef.current) {
        if (subscriptionRef.current.priceSubscription) {
          subscriptionRef.current.priceSubscription.unsubscribe();
        }
        if (subscriptionRef.current.allPoolsSubscription) {
          subscriptionRef.current.allPoolsSubscription.unsubscribe();
        }
        if (subscriptionRef.current.solSubscription) {
          subscriptionRef.current.solSubscription.unsubscribe();
        }
        subscriptionRef.current = null;
      }
      if (datastreamRef.current) {
        datastreamRef.current.disconnect();
        datastreamRef.current = null;
      }
    };
  }, []);

  const formatPrice = (price: number | null) => {
    if (price === null) return '--';
    return price.toFixed(6);
  };

  const reconnect = async () => {
    if (datastreamRef.current) {
      try {
        setWsStatus('connecting');
        await datastreamRef.current.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        setError('Reconnection failed');
      }
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900">Live WebSocket Chart</h3>
            <p className="text-sm text-gray-600">Real-time token price via Solana Tracker SDK</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Live Price</div>
              <div className={`text-xl font-bold transition-all duration-300 ${
                currentPrice ? 
                  priceDirection === 'up' ? 'text-green-500 transform scale-105' :
                  priceDirection === 'down' ? 'text-red-500 transform scale-105' :
                  'text-cyan-600' 
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
              {wsStatus === 'disconnected' && (
                <button
                  onClick={reconnect}
                  className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {/* Chart Container */}
      <div className="p-4">
        <div ref={chartContainerRef} className="w-full h-80 border border-gray-200 rounded-lg" />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 text-center">
          Live updates via Solana Tracker SDK • {data.length} data points
        </div>
      </div>
    </div>
  );
};

export default LiveWebSocketChart;
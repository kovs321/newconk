import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { HeatMapSeries, HeatMapData, HeatMapSeriesOptions } from './HeatMapSeries';

interface PriceData {
  time: number;
  value: number;
}

interface HeatMapBucket {
  time: number;
  prices: number[];
  startTime: number;
  endTime: number;
  intensity: number;
  averagePrice: number;
}

const LiveWebSocketChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Custom'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  
  const [data, setData] = useState<PriceData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatMapData[]>([]);
  const [currentBucket, setCurrentBucket] = useState<HeatMapBucket | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const [currentIntensity, setCurrentIntensity] = useState<number>(0);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const BUCKET_SIZE = 30; // 30 seconds per bucket
  const MAX_INTENSITY = 100; // Maximum intensity value for color scaling

  const TOKEN_MINT = 'DHJVYXsikcimtcVo49FAZqYd1XPYPaXezYhbKArJbonk';
  const SOLANA_TRACKER_WS_URL = 'wss://datastream.solanatracker.io/d4fc0684-2e18-4de4-abab-cbe984738ea7';
  
  const reconnectDelay = 2500;
  const reconnectDelayMax = 4500;
  const randomizationFactor = 0.5;
  
  // Turbo color scheme function
  const turboColor = (t: number): string => {
    t = Math.max(0, Math.min(1, t));
    const r = Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05)))))));
    const g = Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56)))))));
    const b = Math.max(0, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66)))))));
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Cell shader function for heatmap
  const cellShader = (amount: number) => {
    return turboColor(amount / MAX_INTENSITY);
  };
  
  // Calculate price change intensity
  const calculateIntensity = (prices: number[]): number => {
    if (prices.length < 2) return 0;
    
    const priceChanges = [];
    for (let i = 1; i < prices.length; i++) {
      const change = Math.abs(prices[i] - prices[i-1]) / prices[i-1] * 100;
      priceChanges.push(change);
    }
    
    const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    return Math.min(avgChange * 10, MAX_INTENSITY); // Scale intensity
  };
  
  // Get current time bucket
  const getCurrentBucketTime = (timestamp: number): number => {
    return Math.floor(timestamp / BUCKET_SIZE) * BUCKET_SIZE;
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('Initializing live WebSocket chart...');
    
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
      
      const heatmapSeriesView = new HeatMapSeries();
      const heatmapSeries = chart.addCustomSeries(heatmapSeriesView, {
        cellShader,
        cellWidth: 24,
        cellHeight: 15,
      } as HeatMapSeriesOptions);

      chartRef.current = chart;
      seriesRef.current = heatmapSeries;

      // Initialize heatmap with existing data if any
      if (heatmapData.length > 0) {
        heatmapSeries.setData(heatmapData);
      }

      console.log('Live heatmap chart initialized successfully');

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

  // WebSocket connection management
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('Connecting to Solana Tracker WebSocket for live updates...');
    setWsStatus('connecting');

    const ws = new WebSocket(SOLANA_TRACKER_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for live updates');
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
      console.log('WebSocket disconnected');
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

    const priceSubscription = {
      type: 'join',
      room: `price:${TOKEN_MINT}`
    };

    wsRef.current.send(JSON.stringify(priceSubscription));
    console.log(`Subscribed to live price updates for token: ${TOKEN_MINT}`);
  };

  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'message') {
      if (message.room === `price:${TOKEN_MINT}`) {
        const priceData = message.data;
        console.log('Live price update received:', priceData);
        
        const timestamp = Math.floor(priceData.time / 1000);
        const price = priceData.price;
        
        // Update current price with direction
        setCurrentPrice(prevPrice => {
          if (prevPrice !== null) {
            setPriceDirection(price > prevPrice ? 'up' : 'down');
            setTimeout(() => setPriceDirection(null), 1000);
          }
          return price;
        });

        // Add to regular data array for reference
        setData(prevData => {
          const newData = [...prevData, { time: timestamp, value: price }];
          if (newData.length > 1000) {
            newData.splice(0, newData.length - 1000);
          }
          return newData;
        });

        // Process into heatmap buckets
        const bucketTime = getCurrentBucketTime(timestamp);
        
        setCurrentBucket(prevBucket => {
          let updatedBucket: HeatMapBucket;
          
          if (!prevBucket || prevBucket.time !== bucketTime) {
            // New bucket - finalize previous one if exists
            if (prevBucket) {
              const finalIntensity = calculateIntensity(prevBucket.prices);
              const avgPrice = prevBucket.prices.reduce((sum, p) => sum + p, 0) / prevBucket.prices.length;
              
              const heatmapPoint: HeatMapData = {
                time: prevBucket.time as Time,
                value: avgPrice,
                amount: finalIntensity
              };
              
              setHeatmapData(prevHeatmap => {
                const newHeatmap = [...prevHeatmap, heatmapPoint];
                if (newHeatmap.length > 200) {
                  newHeatmap.splice(0, newHeatmap.length - 200);
                }
                return newHeatmap;
              });
              
              // Update chart with finalized bucket
              if (seriesRef.current) {
                seriesRef.current.update(heatmapPoint);
              }
            }
            
            // Start new bucket
            updatedBucket = {
              time: bucketTime,
              prices: [price],
              startTime: timestamp,
              endTime: timestamp,
              intensity: 0,
              averagePrice: price
            };
          } else {
            // Add to existing bucket
            updatedBucket = {
              ...prevBucket,
              prices: [...prevBucket.prices, price],
              endTime: timestamp,
              averagePrice: (prevBucket.averagePrice * prevBucket.prices.length + price) / (prevBucket.prices.length + 1)
            };
          }
          
          // Calculate current intensity for display
          const currentIntensity = calculateIntensity(updatedBucket.prices);
          setCurrentIntensity(currentIntensity);
          
          return updatedBucket;
        });

        // Auto-scroll to keep latest data visible
        if (chartRef.current) {
          const timeScale = chartRef.current.timeScale();
          const logicalRange = timeScale.getVisibleLogicalRange();
          
          if (logicalRange && logicalRange.to > heatmapData.length - 5) {
            timeScale.scrollToRealTime();
          }
        }
      }
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      const leaveSubscription = {
        type: 'leave',
        room: `price:${TOKEN_MINT}`
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

  // Connect on mount
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const formatPrice = (price: number | null) => {
    if (price === null) return '--';
    return price.toFixed(8);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900">Live Price Heatmap</h3>
            <p className="text-sm text-gray-600">Price movement intensity visualization</p>
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
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Movement Intensity</div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded border-2 border-gray-300"
                  style={{ backgroundColor: cellShader(currentIntensity) }}
                  title={`Intensity: ${currentIntensity.toFixed(1)}`}
                ></div>
                <span className="text-sm font-mono text-gray-700">
                  {currentIntensity.toFixed(1)}%
                </span>
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
          Live heatmap via WebSocket • {heatmapData.length} buckets • 30s intervals
        </div>
        <div className="mt-2 flex justify-center items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: cellShader(0) }}></div>
            <span className="text-xs text-gray-500">Low</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: cellShader(50) }}></div>
            <span className="text-xs text-gray-500">Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: cellShader(100) }}></div>
            <span className="text-xs text-gray-500">High</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveWebSocketChart;
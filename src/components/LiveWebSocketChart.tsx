import React, { useEffect, useRef, useState } from 'react';
import { createChart, HistogramSeries, IChartApi, ISeriesApi } from 'lightweight-charts';

interface PriceData {
  time: number;
  value: number;
}

const LiveWebSocketChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  
  const [data, setData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const TOKEN_MINT = 'DHJVYXsikcimtcVo49FAZqYd1XPYPaXezYhbKArJbonk';
  const SOLANA_TRACKER_WS_URL = 'wss://datastream.solanatracker.io/d4fc0684-2e18-4de4-abab-cbe984738ea7';
  
  const reconnectDelay = 2500;
  const reconnectDelayMax = 4500;
  const randomizationFactor = 0.5;

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
          barSpacing: 3,
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
      
      const histogramSeries = chart.addSeries(HistogramSeries, { 
        color: '#26a69a',
        priceFormat: {
          type: 'price',
          precision: 8,
          minMove: 0.00000001,
        },
        priceLineVisible: true,
        lastValueVisible: true,
        title: 'Live Price',
      });

      chartRef.current = chart;
      seriesRef.current = histogramSeries;

      console.log('Live chart initialized successfully');

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
        
        const newPoint: PriceData = {
          time: Math.floor(priceData.time / 1000),
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
            <h3 className="text-lg font-semibold text-gray-900">Live WebSocket Chart</h3>
            <p className="text-sm text-gray-600">Real-time price updates only</p>
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
          Live updates via Solana Tracker WebSocket • {data.length} data points
        </div>
      </div>
    </div>
  );
};

export default LiveWebSocketChart;